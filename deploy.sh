#!/bin/bash
# STARS Corporate Deployment Script for Ubuntu Server
# Run this script on your Contabo VPS to deploy the application

set -e  # Exit on any error

echo "======================================"
echo "STARS Corporate Deployment Script"
echo "======================================"

# Configuration variables
DOMAIN="yourdomain.com"
SERVER_IP="YOUR_SERVER_IP"
DB_PASSWORD="your_secure_password_here"
JWT_SECRET="your_jwt_secret_key_here_make_it_long_and_secure"

echo "🚀 Starting deployment process..."

# 1. System Update
echo "� Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential software-properties-common ufw

# 2. Install Node.js
echo "🟢 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# 3. Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# 4. Setup Database
echo "💾 Setting up database..."
sudo -u postgres psql <<EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'starsapp') THEN
      CREATE USER starsapp WITH PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

SELECT 'CREATE DATABASE starsdb OWNER starsapp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'starsdb')\gexec

GRANT ALL PRIVILEGES ON DATABASE starsdb TO starsapp;
EOF

echo "✅ Database setup complete"

# 5. Install PM2
echo "⚙️ Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup
    echo "⚠️ Please run the startup command shown above to enable PM2 auto-start"
fi

# 6. Install Nginx
echo "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# 7. Configure Firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8083/tcp

# 8. Clone Repository
echo "📥 Cloning repository..."
if [ ! -d "/var/www/starc" ]; then
    cd /var/www
    sudo git clone https://github.com/davidmise/starc.git
    sudo chown -R $USER:$USER /var/www/starc
fi

# 9. Setup Backend
echo "� Setting up backend..."
cd /var/www/starc/backend

# Install dependencies
npm install --production

# Create environment file
cat > .env <<EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=starsdb
DB_USER=starsapp
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false

# Server Configuration
PORT=8083
NODE_ENV=production

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB

# Session Configuration
SESSION_SECRET=$JWT_SECRET

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
EOF

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Setup database schema
echo "📊 Setting up database schema..."
if [ -f "schema.sql" ]; then
    sudo -u postgres psql -d starsdb -f schema.sql
elif [ -f "scripts/setup-database.js" ]; then
    node scripts/setup-database.js
fi

# 10. Create PM2 configuration
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'stars-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8083
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# 11. Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/stars-corporate > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_IP $DOMAIN www.$DOMAIN;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Client settings
    client_max_body_size 50M;

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8083;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Max-Age 86400;
            return 204;
        }
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/starc/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Health check
    location /api/health {
        proxy_pass http://127.0.0.1:8083;
        access_log off;
    }

    # Default location
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ =404;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/stars-corporate /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# 12. Start services
echo "🚀 Starting services..."

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save

# Restart Nginx
sudo systemctl restart nginx

# 13. Create backup script
echo "💾 Setting up backup script..."
sudo tee /usr/local/bin/backup-stars-db.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/starsdb"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="starsdb"

mkdir -p \$BACKUP_DIR
sudo -u postgres pg_dump \$DB_NAME > \$BACKUP_DIR/starsdb_backup_\$DATE.sql
find \$BACKUP_DIR -name "starsdb_backup_*.sql" -mtime +7 -delete

echo "Backup completed: \$BACKUP_DIR/starsdb_backup_\$DATE.sql"
EOF

sudo chmod +x /usr/local/bin/backup-stars-db.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-stars-db.sh") | crontab -

# 14. Final tests
echo "🧪 Running final tests..."

sleep 5  # Wait for services to start

# Test backend
if curl -f http://localhost:8083/api/health > /dev/null 2>&1; then
    echo "✅ Backend is responding locally"
else
    echo "❌ Backend is not responding locally"
    pm2 logs stars-backend --lines 10
fi

# Test through Nginx
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Nginx proxy is working"
else
    echo "❌ Nginx proxy is not working"
    sudo tail -5 /var/log/nginx/error.log
fi

echo ""
echo "======================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================================"
echo ""
echo "Your STARS Corporate backend is now running:"
echo "🔗 API URL: http://$SERVER_IP/api"
echo "🔗 Health Check: http://$SERVER_IP/api/health"
echo ""
echo "Next steps:"
echo "1. Update your mobile app to use: http://$SERVER_IP/api"
echo "2. Test all endpoints work correctly"
echo "3. (Optional) Setup SSL certificate with certbot"
echo "4. (Optional) Configure domain name"
echo ""
echo "Useful commands:"
echo "📊 Check backend status: pm2 status"
echo "📋 View backend logs: pm2 logs stars-backend"
echo "🔄 Restart backend: pm2 restart stars-backend"
echo "🌐 Check Nginx status: sudo systemctl status nginx"
echo "📋 View Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🔐 Your database credentials:"
echo "   Database: starsdb"
echo "   User: starsapp"
echo "   Password: $DB_PASSWORD"
echo ""

# Final status check
echo "Service Status:"
echo "==============="
pm2 status
echo ""
sudo systemctl status nginx --no-pager -l
echo ""
echo "🎯 Ready for production!"
#!/bin/bash
# STARS Corporate Contabo VPS Deployment Script
# Server IP: 158.220.102.111
# Backend Port: 81

set -e  # Exit on any error

echo "======================================"
echo "🚀 STARS Corporate Contabo Deployment"
echo "======================================"

# Configuration variables (your specific setup)
SERVER_IP="158.220.102.111"
BACKEND_PORT="81"
DB_NAME="stars_db"
DB_USER="stars_user"
DB_PASSWORD="Qwerty@2024#"
JWT_SECRET="stars_corporate_jwt_secret_key_2024"

echo "🔧 Configuring for Contabo VPS..."
echo "📍 Server IP: $SERVER_IP"
echo "🔌 Backend Port: $BACKEND_PORT"

# 1. System Update
echo "📦 Updating system packages..."
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

# 4. Setup Database with your specific configuration
echo "💾 Setting up database..."
sudo -u postgres psql <<EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "✅ Database setup complete"

# 5. Install PM2
echo "⚙️ Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup
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
sudo ufw allow $BACKEND_PORT/tcp

# 8. Clone Repository
echo "📥 Cloning repository..."
if [ ! -d "/var/www/starc" ]; then
    cd /var/www
    sudo git clone https://github.com/davidmise/starc.git
    sudo chown -R $USER:$USER /var/www/starc
fi

# 9. Setup Backend with your configuration
echo "🔧 Setting up backend..."
cd /var/www/starc/backend

# Install dependencies
npm install --production

# Copy your specific environment configuration
cp env.contabo .env

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Setup database schema
echo "📊 Setting up database schema..."
sudo -u postgres psql -d $DB_NAME -f schema.sql

# 10. Create PM2 configuration for port 81
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
      PORT: $BACKEND_PORT
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

# 11. Configure Nginx with your specific setup
echo "🌐 Configuring Nginx for port $BACKEND_PORT..."
sudo cp /var/www/starc/nginx.conf /etc/nginx/sites-available/stars-corporate

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

# 13. Create database backup script
echo "💾 Setting up backup script..."
sudo tee /usr/local/bin/backup-stars-db.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/$DB_NAME"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR
sudo -u postgres pg_dump $DB_NAME > \$BACKUP_DIR/${DB_NAME}_backup_\$DATE.sql
find \$BACKUP_DIR -name "${DB_NAME}_backup_*.sql" -mtime +7 -delete

echo "Backup completed: \$BACKUP_DIR/${DB_NAME}_backup_\$DATE.sql"
EOF

sudo chmod +x /usr/local/bin/backup-stars-db.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-stars-db.sh") | crontab -

# 14. Final tests
echo "🧪 Running final tests..."

sleep 5  # Wait for services to start

# Test backend on port 81
if curl -f http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo "✅ Backend is responding on port $BACKEND_PORT"
else
    echo "❌ Backend is not responding on port $BACKEND_PORT"
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
echo "🎉 CONTABO DEPLOYMENT COMPLETE!"
echo "======================================"
echo ""
echo "🔗 Your STARS Corporate backend is running:"
echo "   API URL: http://$SERVER_IP/api"
echo "   Health: http://$SERVER_IP/api/health"
echo "   Direct: http://$SERVER_IP:$BACKEND_PORT/api"
echo ""
echo "📱 Update your mobile app to use:"
echo "   const API_URL = 'http://$SERVER_IP'"
echo ""
echo "🔐 Database credentials:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status                    - Check backend status"
echo "   pm2 logs stars-backend        - View backend logs"
echo "   pm2 restart stars-backend     - Restart backend"
echo "   sudo systemctl status nginx  - Check Nginx status"
echo ""

# Final status check
echo "📊 Current Status:"
echo "=================="
pm2 status
echo ""
sudo systemctl status nginx --no-pager -l
echo ""
echo "🎯 Ready for production testing!"

# Test the actual endpoints
echo ""
echo "🔬 Testing endpoints..."
echo "Health check:"
curl -s http://localhost/api/health || echo "❌ Health check failed"
echo ""
echo "Sessions endpoint:"
curl -s http://localhost/api/sessions || echo "❌ Sessions endpoint failed"
echo ""
echo "✅ Deployment verification complete!"
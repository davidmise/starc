# STARS Corporate Server Deployment Guide

Complete step-by-step guide for deploying the STARS Corporate backend and database on Ubuntu Server (Contabo VPS).

## Server Information
- **Server**: Ubuntu Server (Contabo VPS)
- **Backend Port**: 8083
- **Database**: PostgreSQL
- **Web Server**: Nginx (reverse proxy)

## Prerequisites

### 1. Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential software-properties-common
```

### 2. Install Node.js (Latest LTS)
```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3. Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
sudo -u postgres psql

-- In PostgreSQL prompt:
CREATE USER postgres WITH PASSWORD 'Qwerty@2024#';
CREATE DATABASE stars_corporate OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE stars_corporate TO postgres;
\q
```

### 4. Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 5. Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw allow 8083/tcp
sudo ufw --force enable
```

## Backend Deployment

### 1. Clone Repository
```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/davidmise/starc.git
sudo chown -R $USER:$USER /var/www/starc
cd /var/www/starc
```

### 2. Setup Backend Environment
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Create environment file
cp env.example .env

# Edit environment file
nano .env
```

### 3. Configure Environment Variables
Edit `/var/www/starc/backend/.env`:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stars_corporate
DB_USER=postgres
DB_PASSWORD=Qwerty@2024#
DB_SSL=false

# Server Configuration
PORT=8083
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

### 4. Setup Database Schema
```bash
# Run database setup script
cd /var/www/starc/backend
node scripts/setup-database.js

# If you have the schema.sql file, run it directly:
sudo -u postgres psql -d stars_corporate -f schema.sql
```

### 5. Test Backend Locally
```bash
# Test the backend
cd /var/www/starc/backend
npm start

# Test API endpoints (in another terminal)
curl http://localhost:8083/api/health
curl http://localhost:8083/api/sessions


# If working, stop the test server (Ctrl+C)
```

### 6. Deploy with PM2
```bash
# Navigate to backend directory
cd /var/www/starc/backend

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Create `ecosystem.config.js`:
```javascript
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
```

```bash
# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs stars-backend

# Monitor (optional)
pm2 monit
```

## SSL Certificate Setup (Let's Encrypt)

### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Get SSL Certificate
```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Database Backup Setup

### 1. Create Backup Script
```bash
sudo nano /usr/local/bin/backup-stars-db.sh
```

```bash
#!/bin/bash
# STARS Database Backup Script

BACKUP_DIR="/var/backups/stars_corporate"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="stars_corporate"
DB_USER="postgres"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
sudo -u postgres pg_dump $DB_NAME > $BACKUP_DIR/stars_corporate_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "stars_corporate_backup_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/stars_corporate_backup_$DATE.sql"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-stars-db.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-stars-db.sh
```

## Monitoring and Logs

### 1. View Application Logs
```bash
# PM2 logs
pm2 logs stars-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### 2. Check Application Status
```bash
# PM2 status
pm2 status

# Check if backend is responding
curl http://localhost:8083/api/health

# Check via Nginx (if configured)
curl https://yourdomain.com/api/health
```

## Security Hardening

### 1. Database Security
```bash
# Secure PostgreSQL
sudo -u postgres psql

-- Change default postgres password
ALTER USER postgres PASSWORD 'new_secure_password';

-- Remove default database access
REVOKE ALL ON DATABASE postgres FROM public;

\q
```

### 2. File Permissions
```bash
# Set proper permissions
sudo chown -R $USER:www-data /var/www/starc
sudo chmod -R 750 /var/www/starc

# Protect environment files
chmod 600 /var/www/starc/backend/.env
```

### 3. Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8083/tcp  # Backend port
sudo ufw --force enable
```

## Troubleshooting

### Common Issues

1. **Backend won't start**
```bash
# Check logs
pm2 logs stars-backend

# Check if port is in use
sudo netstat -tulpn | grep 8083

# Restart PM2
pm2 restart stars-backend
```

2. **Database connection issues**
```bash
# Test database connection
sudo -u postgres psql -d stars_corporate -c "SELECT version();"

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

3. **Nginx issues**
```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

## Deployment Commands Summary

```bash
# Quick deployment script
cd /var/www/starc
git pull origin main
cd backend
npm install --production
pm2 restart stars-backend

# Check status
pm2 status
curl http://localhost:8083/api/health
```

## Next Steps

1. Configure Nginx reverse proxy (see nginx configuration file)
2. Update your mobile app's API URL to point to your server
3. Test all API endpoints
4. Setup monitoring and alerting
5. Configure automated deployments (optional)

Your backend should now be running at:
- **Local**: http://YOUR_SERVER_IP:8083
- **Domain**: https://yourdomain.com (after Nginx setup)

Remember to replace placeholders:
- `yourdomain.com` with your actual domain
- `Qwerty@2024#` with strong passwords
- `YOUR_SERVER_IP` with your Contabo VPS IP address
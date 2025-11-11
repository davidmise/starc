# 🚀 STARS Corporate - Contabo Server Deployment

Complete deployment package for your Contabo VPS (158.220.102.111) with backend on port 81.

## 📁 Deployment Files Created

### 1. **`env.contabo`** - Production Environment Configuration
```bash
# Copy this to your server as .env in the backend directory
cp env.contabo .env
```

### 2. **`nginx.conf`** - Nginx Reverse Proxy Configuration
```bash
# Copy this to your server's Nginx sites-available
sudo cp nginx.conf /etc/nginx/sites-available/stars-corporate
```

### 3. **`schema.sql`** - Complete Database Schema
```bash
# Import this into your PostgreSQL database
sudo -u postgres psql -d stars_db -f schema.sql
```

### 4. **`deploy-contabo.sh`** - Automated Deployment Script
```bash
# Run this script on your Contabo server
chmod +x deploy-contabo.sh
./deploy-contabo.sh
```

## 🔧 Server Configuration

- **Server IP**: 158.220.102.111
- **Backend Port**: 81
- **Database**: stars_db
- **Database User**: stars_user
- **Database Password**: Qwerty@2024#

## 🚀 Quick Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **Upload files to your server:**
```bash
# On your Contabo VPS:
cd ~
git clone https://github.com/davidmise/starc.git
cd starc
chmod +x deploy-contabo.sh
./deploy-contabo.sh
```

### Option 2: Manual Deployment

1. **Copy environment file:**
```bash
cd /var/www/starc/backend
cp env.contabo .env
```

2. **Install and configure Nginx:**
```bash
sudo cp nginx.conf /etc/nginx/sites-available/stars-corporate
sudo ln -s /etc/nginx/sites-available/stars-corporate /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

3. **Setup database:**
```bash
sudo -u postgres psql -d stars_db -f schema.sql
```

4. **Start backend:**
```bash
cd /var/www/starc/backend
npm install --production
pm2 start ecosystem.config.js
pm2 save
```

## 📱 Frontend Configuration

Update your mobile app to use your server:

```javascript
// In your app configuration
const API_BASE_URL = 'http://158.220.102.111';

// Update any hardcoded localhost URLs to:
const API_URL = 'http://158.220.102.111/api';
```

## 🧪 Testing Your Deployment

After deployment, test these endpoints:

```bash
# Health check
curl http://158.220.102.111/api/health

# Sessions endpoint
curl http://158.220.102.111/api/sessions

# Direct backend access
curl http://158.220.102.111:81/api/health
```

## 🔍 Troubleshooting

### Backend Issues
```bash
# Check PM2 status
pm2 status

# View backend logs
pm2 logs stars-backend

# Restart backend
pm2 restart stars-backend
```

### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database Issues
```bash
# Test database connection
sudo -u postgres psql -d stars_db -c "SELECT version();"

# Check PostgreSQL status
sudo systemctl status postgresql
```

## 📊 Monitoring Commands

```bash
# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# View real-time logs
pm2 logs stars-backend
sudo tail -f /var/log/nginx/access.log

# Check server resources
htop
df -h
```

## 🔄 Updating Your App

When you make changes to your code:

```bash
# Pull latest changes
cd /var/www/starc
git pull origin main

# Update backend
cd backend
npm install --production
pm2 restart stars-backend

# Update frontend (if needed)
cd ..
npm install
npm run build
```

## 🛡️ Security Notes

- **Firewall**: UFW configured to allow only necessary ports (22, 80, 443, 81)
- **Database**: Isolated user with limited privileges
- **Nginx**: Security headers and rate limiting enabled
- **SSL**: Ready for Let's Encrypt certificate (optional)

## 📋 What's Fixed

✅ **Backend Configuration**: Port 81 as requested
✅ **Database Setup**: stars_db with stars_user credentials  
✅ **Nginx Proxy**: Correct IP and CORS headers
✅ **Environment Variables**: Production-ready configuration
✅ **Frontend Emojis**: Removed emojis from test buttons
✅ **Database Schema**: Complete schema with all tables and indexes

## 🎯 Next Steps

1. **Deploy to server** using the automated script
2. **Test endpoints** to ensure everything works
3. **Update mobile app** to use your server IP
4. **Build new APK** with updated backend URL
5. **Test full functionality** end-to-end

## 📞 Support

If you encounter any issues:

1. Check the logs: `pm2 logs stars-backend`
2. Verify Nginx: `sudo nginx -t`
3. Test database: `sudo -u postgres psql -d stars_db`
4. Restart services: `pm2 restart stars-backend && sudo systemctl restart nginx`

Your STARS Corporate app is now ready for production deployment! 🚀
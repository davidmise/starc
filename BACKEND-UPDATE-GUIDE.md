# Backend Update Guide - Fix Connection Issues

## Changes Made

### 1. Frontend Updates
- **API URL**: Updated to `http://158.220.102.111:81/api` for all platforms
- **Timeout**: Increased to 30 seconds for better reliability with production server
- **Connection Monitoring**: Added automatic connection health checks every 10 seconds
- **Better Logging**: Enhanced error messages for debugging connection issues

### 2. Backend Updates
- **CORS Configuration**: Now uses environment variable `CORS_ORIGIN=*` to allow mobile app connections
- **Socket.IO CORS**: Updated to allow all origins for mobile compatibility
- **Dynamic CORS**: Server now reads CORS settings from `.env` file

### 3. Environment Configuration
- **env.contabo**: Updated `CORS_ORIGIN=*` and `SOCKET_CORS_ORIGIN=*` for mobile access

## Deployment Steps

### Step 1: Update Backend Code on Server
```bash
# SSH into your Contabo server
ssh root@158.220.102.111

# Navigate to your backend directory
cd /opt/stars-backend

# Pull latest changes or upload new server.js
# If using git:
git pull origin main

# If uploading manually, copy the updated server.js to the server
```

### Step 2: Update Environment File
```bash
# Edit the .env file on the server
nano .env

# Update these lines:
CORS_ORIGIN=*
SOCKET_CORS_ORIGIN=*

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 3: Restart Backend Service
```bash
# Restart using PM2
pm2 restart stars-backend

# Or if not using PM2:
# pkill -f "node server.js"
# nohup node server.js &

# Check logs
pm2 logs stars-backend
```

### Step 4: Verify Connection
```bash
# Test health endpoint
curl http://158.220.102.111:81/api/health

# Should return: {"status":"OK","message":"Stars Corporate API is running"}
```

### Step 5: Rebuild Mobile App
```bash
# On your development machine
cd /path/to/StarsC

# Build new APK with updated frontend
eas build --platform android --profile apk-test

# Wait for build to complete and download the new APK
```

## Testing Checklist

- [ ] Backend health check returns OK
- [ ] Mobile app shows "Connected" status (green dot)
- [ ] Login works without disconnection
- [ ] API calls complete successfully
- [ ] No CORS errors in backend logs
- [ ] App stays connected after 10+ seconds

## Troubleshooting

### Still Showing "Disconnected"
1. Check if backend is running: `pm2 status`
2. Check backend logs: `pm2 logs stars-backend`
3. Verify port 81 is open: `netstat -tulpn | grep 81`
4. Check firewall: `ufw status`
5. Test from device: Open browser on phone and visit `http://158.220.102.111:81/api/health`

### CORS Errors
1. Verify `.env` has `CORS_ORIGIN=*`
2. Restart backend after changing `.env`
3. Check backend logs for CORS-related errors

### Timeout Issues
1. Check server load: `top` or `htop`
2. Verify database connection: `pm2 logs stars-backend | grep "Database"`
3. Increase timeout if needed (already set to 30s)

### Can't Access from Mobile
1. Ensure phone is connected to internet (not same WiFi as server)
2. Verify server IP is accessible: `ping 158.220.102.111`
3. Check if Nginx is running: `systemctl status nginx`
4. Verify Nginx proxy pass is correct

## Quick Commands Reference

```bash
# Check backend status
pm2 status

# View backend logs
pm2 logs stars-backend

# Restart backend
pm2 restart stars-backend

# Test health endpoint
curl http://localhost:81/api/health
curl http://158.220.102.111:81/api/health

# Check what's using port 81
netstat -tulpn | grep 81

# Restart Nginx
systemctl restart nginx
```

## Notes

- The app now checks backend health every 10 seconds
- Connection status updates automatically
- Mobile apps need to allow all origins (`*`) in CORS
- Production server timeout increased to 30 seconds
- All API requests now log connection status

## Security Note

For production deployment, consider:
1. Using specific CORS origins instead of `*` (but this requires knowing all client IPs)
2. Implementing API rate limiting (already configured)
3. Using HTTPS with SSL certificate
4. Setting up proper authentication middleware

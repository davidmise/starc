# NGINX Configuration for STARS Corporate

## Complete Nginx setup for Ubuntu Server with backend on port 8083

### 1. Main Nginx Configuration

Create `/etc/nginx/sites-available/stars-corporate`:

```nginx
# STARS Corporate Nginx Configuration
# Backend running on port 8083

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

# Upstream backend configuration
upstream stars_backend {
    server 127.0.0.1:8083;
    keepalive 32;
}

# HTTP to HTTPS redirect (if using SSL)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt will modify this)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Client settings
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Frontend (if serving static files)
    location / {
        root /var/www/starc/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API endpoints - proxy to backend
    location /api/ {
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        # Proxy settings
        proxy_pass http://stars_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Authentication endpoints with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://stars_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://stars_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific settings
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # File uploads endpoint
    location /api/upload {
        client_max_body_size 100M;
        client_body_timeout 300s;
        
        proxy_pass http://stars_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Upload specific timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://stars_backend;
        access_log off;
    }
    
    # Static file serving for uploads
    location /uploads/ {
        alias /var/www/starc/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
        
        # Security for uploaded files
        add_header X-Content-Type-Options nosniff;
        location ~* \.(php|jsp|pl|py|asp|sh)$ {
            deny all;
        }
    }
}

# API Subdomain Configuration (optional)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Include SSL settings from main server
    include /etc/nginx/snippets/ssl-params.conf;
    
    # CORS headers for API subdomain
    add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials true always;
    
    # Handle preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://yourdomain.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Max-Age 86400;
            return 204;
        }
        
        # Rate limiting
        limit_req zone=api burst=50 nodelay;
        
        # Proxy to backend
        proxy_pass http://stars_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. SSL Parameters Snippet

Create `/etc/nginx/snippets/ssl-params.conf`:

```nginx
# SSL Configuration Snippet for STARS Corporate

ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Session settings
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# DH parameters
ssl_dhparam /etc/nginx/dhparam.pem;
```

### 3. Setup Instructions

```bash
# 1. Create the configuration file
sudo nano /etc/nginx/sites-available/stars-corporate

# Paste the configuration above, replacing 'yourdomain.com' with your domain

# 2. Create SSL parameters snippet
sudo nano /etc/nginx/snippets/ssl-params.conf

# Paste the SSL configuration above

# 3. Generate DH parameters (this may take several minutes)
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048

# 4. Test configuration
sudo nginx -t

# 5. Enable the site
sudo ln -s /etc/nginx/sites-available/stars-corporate /etc/nginx/sites-enabled/

# 6. Remove default site
sudo rm /etc/nginx/sites-enabled/default

# 7. Restart Nginx
sudo systemctl restart nginx
```

### 4. Without SSL (HTTP only) - For testing

If you want to test without SSL first:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com YOUR_SERVER_IP;

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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    }

    # Health check
    location /api/health {
        proxy_pass http://127.0.0.1:8083;
        access_log off;
    }

    # Static files (if needed)
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }
}
```

### 5. Testing the Configuration

```bash
# Test Nginx configuration
sudo nginx -t

# Check if backend is running
curl http://localhost:8083/api/health

# Test through Nginx (HTTP)
curl http://YOUR_SERVER_IP/api/health

# Test through Nginx (HTTPS, if configured)
curl https://yourdomain.com/api/health

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 6. Firewall Configuration

```bash
# Open necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8083/tcp # Backend (optional, for direct access)
sudo ufw enable
```

### 7. Performance Optimization (Optional)

Add to `/etc/nginx/nginx.conf` in the `http` block:

```nginx
# Worker settings
worker_processes auto;
worker_connections 1024;

# Buffer settings
client_body_buffer_size 128k;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;

# Keepalive settings
keepalive_timeout 30;
keepalive_requests 100;

# Cache settings
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
```

## Quick Setup Commands

Replace `yourdomain.com` and `YOUR_SERVER_IP` with your actual values:

```bash
# 1. Create basic HTTP configuration (for testing)
sudo tee /etc/nginx/sites-available/stars-corporate > /dev/null <<EOF
server {
    listen 80;
    server_name YOUR_SERVER_IP yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8083;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
    }
}
EOF

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/stars-corporate /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 3. Test and restart
sudo nginx -t && sudo systemctl restart nginx

# 4. Test API
curl http://YOUR_SERVER_IP/api/health
```

This configuration will:
- Proxy all `/api/*` requests to your backend on port 8083
- Handle CORS for frontend requests
- Provide SSL termination (when configured)
- Include security headers and rate limiting
- Support WebSocket connections for real-time features
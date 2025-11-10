#!/usr/bin/env bash
# Ubuntu VPS bootstrap script for deploying Star Corporate (backend)
# Usage: ssh ubuntu@your-vps 'bash -s' < setup_vps.sh

set -euo pipefail

### === NOTES & ASSUMPTIONS ===
# - Run as a user with sudo privileges
# - This script is opinionated for Ubuntu 20.04/22.04
# - It installs Node 18, PM2, Nginx, Certbot, PostgreSQL (optional), git
# - You should review and adapt variables below before running in production

### Customize these variables as needed
APP_USER="starc"
APP_DIR="/var/www/starc/backend"
REPO_GIT_URL="https://github.com/davidmise/starc.git"
BRANCH="main"
NODE_VERSION=18
DOMAIN="api.example.com"  # <- change to your domain
USE_LETSENCRYPT=true
INSTALL_POSTGRES=true     # set false if you use managed DB

echo "==> Updating apt repositories"
sudo apt-get update -y

echo "==> Installing base packages"
sudo apt-get install -y build-essential git curl ufw nginx

echo "==> Installing Node.js ${NODE_VERSION} from NodeSource"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Installing PM2 (global)"
sudo npm install -g pm2@latest

if [ "$INSTALL_POSTGRES" = true ]; then
  echo "==> Installing PostgreSQL"
  sudo apt-get install -y postgresql postgresql-contrib
  sudo systemctl enable --now postgresql
fi

echo "==> Creating application user and folders"
if ! id -u $APP_USER >/dev/null 2>&1; then
  sudo adduser --system --group --no-create-home $APP_USER || true
fi

sudo mkdir -p $APP_DIR
sudo chown -R $APP_USER:$APP_USER $(dirname $APP_DIR)

echo "==> Cloning repository (or pulling latest)"
if [ -d "$APP_DIR/.git" ]; then
  sudo -u $APP_USER git -C $APP_DIR fetch --all
  sudo -u $APP_USER git -C $APP_DIR checkout $BRANCH
  sudo -u $APP_USER git -C $APP_DIR pull origin $BRANCH
else
  sudo -u $APP_USER git clone --branch $BRANCH $REPO_GIT_URL $APP_DIR
fi

echo "==> Installing backend dependencies"
cd $APP_DIR
sudo -u $APP_USER npm ci --omit=dev

echo "==> Creating .env.production template"
cat <<'EOF' | sudo -u $APP_USER tee $APP_DIR/.env.production >/dev/null
# Copy and fill values (do NOT commit secrets)
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stars_corporate
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
JWT_SECRET=CHANGE_ME
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
REDIS_URL=redis://localhost:6379
NODE_ENV=production
MAX_FILE_SIZE=52428800
SOCKET_CORS_ORIGIN=https://$DOMAIN
FRONTEND_URL=https://your-frontend-domain
EOF

echo "==> Configuring UFW (firewall)"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full' || true
sudo ufw --force enable

echo "==> Setting up systemd user for PM2"
# Use pm2 to manage node process; register startup script
sudo -u $APP_USER bash -lc "pm2 start server.js --name starc --env production"
sudo -u $APP_USER bash -lc "pm2 save"
sudo pm2 startup systemd -u $APP_USER --hp /home/$APP_USER | sed -n '1,200p'

echo "==> Creating Nginx site configuration (example)"
NGINX_CONF="/etc/nginx/sites-available/starc.conf"
sudo tee $NGINX_CONF >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect to HTTPS handled by Certbot when enabled
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/starc.conf
sudo nginx -t && sudo systemctl reload nginx

if [ "$USE_LETSENCRYPT" = true ]; then
  echo "==> Installing Certbot and obtaining certificate for $DOMAIN"
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN || true
fi

echo "==> Deployment script finished. Next steps:"
echo "  - Edit $APP_DIR/.env.production and fill secrets (DB password, JWT_SECRET, S3 keys)"
echo "  - Restart PM2: sudo -u $APP_USER pm2 restart starc"
echo "  - Confirm application is reachable at http(s)://$DOMAIN"

exit 0

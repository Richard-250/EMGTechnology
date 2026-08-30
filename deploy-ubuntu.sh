#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   EMG Technology - Production Automated Server Setup     "
echo "=========================================================="

# 1. Setup Swap (Crucial for 2GB RAM instances during build)
echo ">>> [1/8] Checking and creating swap space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 2. Update and install packages
echo ">>> [2/8] Updating system and installing base dependencies..."
sudo apt update -y
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# 2. Install Node.js 22 LTS & PM2
echo ">>> [2/7] Installing Node.js 22 LTS and PM2..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 3. Setup PostgreSQL Database
echo ">>> [3/7] Configuring PostgreSQL database..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'emg_admin'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER emg_admin WITH PASSWORD 'emg_prod_password_2026!';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'emgtechnology'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE emgtechnology OWNER emg_admin;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE emgtechnology TO emg_admin;"

# 4. Clone or pull repo
echo ">>> [4/7] Setting up application repository..."
APP_DIR="/var/www/EMGTechnology"
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p /var/www
    sudo chown -R $USER:$USER /var/www
    git clone https://github.com/Richard-250/EMGTechnology.git "$APP_DIR"
fi

cd "$APP_DIR"
git pull origin main

# 5. Setup environment files
echo ">>> [5/8] Configuring environment variables..."
cat <<EOT > apps/server/.env
APP_ENV=prod
PORT=3001
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
COOKIE_SECRET=emg_production_cookie_secret_998877665544332211
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emgtechnology
DB_USERNAME=emg_admin
DB_PASSWORD=emg_prod_password_2026!
DB_SYNCHRONIZE=true
EOT

cat <<EOT > apps/storefront/.env.local
NODE_ENV=production
VENDURE_SHOP_API_URL=http://127.0.0.1:3001/shop-api
NEXT_PUBLIC_VENDURE_SHOP_API_URL=http://127.0.0.1:3001/shop-api
NEXT_PUBLIC_VENDURE_API_URL=http://127.0.0.1:3001
EOT

# 6. Install dependencies, initialize database & build
echo ">>> [6/8] Installing dependencies..."
npm install

echo ">>> [7/8] Seeding initial fitness store catalog..."
npm run seed -w server || true

# Turn off synchronize for safety after initial creation
sed -i 's/DB_SYNCHRONIZE=true/DB_SYNCHRONIZE=false/g' apps/server/.env

echo ">>> [8/8] Building all applications (Server, Dashboard & Storefront)..."
npm run build

# 7. Start PM2 services and configure Nginx
echo ">>> [7/7] Starting apps with PM2 and configuring Nginx..."
pm2 start ecosystem.config.cjs || pm2 restart ecosystem.config.cjs
pm2 save

cat << 'NGINX_CONF' | sudo tee /etc/nginx/sites-available/emgtechnology
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    # Storefront (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Vendure API, Admin Dashboard & Assets
    location ~ ^/(shop-api|admin-api|dashboard|assets) {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_CONF

sudo ln -sf /etc/nginx/sites-available/emgtechnology /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "=========================================================="
echo "   ✅ EMG TECHNOLOGY DEPLOYMENT COMPLETE!                "
echo "=========================================================="
echo " - Storefront: http://<YOUR_SERVER_IP>"
echo " - Admin Dashboard: http://<YOUR_SERVER_IP>/dashboard"
echo " - Admin Login: superadmin / superadmin"
echo "=========================================================="

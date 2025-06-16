#!/bin/bash

# EphemeralMail Frontend Deployment Script
# Usage: ./deploy.sh [domain] [repository_url]

set -e

DOMAIN=${1:-"localhost"}
REPO_URL=${2:-"https://github.com/tacssuki/EphemeralMail-svelte.git"}
PROJECT_DIR="/opt/ephemeral-mail-frontend"
SERVICE_NAME="ephemeral-mail-frontend"

echo "🚀 Deploying EphemeralMail Frontend to $DOMAIN..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js 18 if not already installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "🌐 Installing nginx..."
    sudo apt install -y nginx
fi

# Create project directory
echo "📁 Setting up project directory..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "🔄 Updating existing repository..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Install dependencies and build
echo "🔨 Building application..."
npm install
npm run build

# Configure nginx
echo "⚙️ Configuring nginx..."
sudo tee /etc/nginx/sites-available/$SERVICE_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $PROJECT_DIR/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Remove server signature
    server_tokens off;

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /index.html;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Frontend URL: http://$DOMAIN"
echo "📁 Project directory: $PROJECT_DIR"
echo ""
echo "Next steps:"
echo "1. Update your DNS to point $DOMAIN to this server"
echo "2. Configure SSL with Let's Encrypt: sudo certbot --nginx -d $DOMAIN"
echo "3. Update the .env file with your backend API endpoint"
echo ""
echo "To update the frontend in the future, run:"
echo "cd $PROJECT_DIR && git pull && npm run build && sudo systemctl reload nginx"

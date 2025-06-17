#!/bin/bash

# EphemeralMail Frontend Deployment Script
# Usage: ./deploy-frontend.sh [your-domain.com]
#
# This script deploys the EphemeralMail frontend to work with an existing backend
# Prerequisites: EphemeralMail backend must be already deployed and running

set -e

DOMAIN=${1:-localhost}
FRONTEND_DIR="/opt/ephemeral-mail-frontend"
SERVICE_USER="www-data"

echo "🎨 EphemeralMail Frontend Deployment Script"
echo "📍 Domain: $DOMAIN" 
echo "📁 Installation directory: $FRONTEND_DIR"
echo ""
echo "⚠️  Prerequisites Check:"
echo "   1. EphemeralMail backend must be running on this server"
echo "   2. Backend should be accessible at https://$DOMAIN/api/"
echo "   3. This script requires root/sudo access"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s "http://localhost:4444/api/health" > /dev/null; then
    echo "✅ Backend detected on port 4444"
else
    echo "❌ Backend not detected on port 4444"
    echo "   Please deploy the EphemeralMail backend first:"
    echo "   https://github.com/tacssuki/EphemeralMail"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update

# Install Node.js 18 if not present
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null || [[ $(node -v) != v18* ]]; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js $(node -v) installed"
else
    echo "✅ Node.js $(node -v) already installed"
fi

# Install PM2 and serve
echo "📦 Installing PM2 and serve..."
npm install -g pm2 serve

# Clone or update repository
if [ -d "$FRONTEND_DIR" ]; then
    echo "📦 Updating existing frontend installation..."
    cd $FRONTEND_DIR
    git pull
else
    echo "📦 Fresh frontend installation..."
    git clone https://github.com/tacssuki/EphemeralMail-svelte.git $FRONTEND_DIR
    cd $FRONTEND_DIR
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Configure environment for production
echo "⚙️ Configuring environment..."
cat > .env << EOF
VITE_API_URL=https://$DOMAIN
EOF

echo "✅ Environment configured:"
cat .env

# Build for production
echo "🔨 Building for production..."
npm run build

# Set proper ownership
echo "👤 Setting up file permissions..."
chown -R $SERVICE_USER:$SERVICE_USER $FRONTEND_DIR

# Stop any existing PM2 process
echo "🔄 Managing PM2 process..."
pm2 delete ephemeral-mail-frontend 2>/dev/null || true

# Start frontend with PM2
pm2 serve dist 3000 --name "ephemeral-mail-frontend" --spa
pm2 startup
pm2 save

# Update Nginx configuration
NGINX_CONFIG="/etc/nginx/sites-available/ephemeral-mail"

if [ -f "$NGINX_CONFIG" ]; then
    echo "🌐 Updating Nginx configuration..."
    
    # Backup existing config
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update config to include frontend
    cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API routes (backend)
    location /api/ {
        proxy_pass http://127.0.0.1:4444/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers for preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Frontend (Svelte app)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Test and reload Nginx
    nginx -t
    systemctl reload nginx
    echo "✅ Nginx configuration updated and reloaded"
else
    echo "⚠️  Nginx config not found at $NGINX_CONFIG"
    echo "   Please configure Nginx manually to:"
    echo "   - Proxy /api/* to http://127.0.0.1:4444/"
    echo "   - Proxy / to http://127.0.0.1:3000"
fi

# Final status check
echo ""
echo "🔍 Deployment Status Check:"

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status | grep ephemeral-mail || echo "No PM2 processes found"

# Check if frontend is responding
echo ""
echo "🌐 Testing services..."
if curl -s -I "http://127.0.0.1:3000" | grep -q "200 OK"; then
    echo "✅ Frontend responding on port 3000"
else
    echo "❌ Frontend not responding on port 3000"
fi

if curl -s -I "http://127.0.0.1:4444/api/health" | grep -q "200 OK"; then
    echo "✅ Backend responding on port 4444"
else
    echo "❌ Backend not responding on port 4444"
fi

echo ""
echo "🎉 Frontend deployment completed!"
echo ""
echo "📍 Your EphemeralMail frontend should now be available at:"
echo "   🌐 https://$DOMAIN"
echo ""
echo "📍 API documentation available at:"
echo "   📚 https://$DOMAIN/api-docs"
echo ""
echo "🔧 Management commands:"
echo "   📊 Check status:  pm2 status"
echo "   📋 View logs:     pm2 logs ephemeral-mail-frontend"
echo "   🔄 Restart:       pm2 restart ephemeral-mail-frontend"
echo "   🛑 Stop:          pm2 stop ephemeral-mail-frontend"
echo ""
echo "🧪 Test your deployment:"
echo "   1. Visit https://$DOMAIN"
echo "   2. Click 'Generate New Email'"
echo "   3. Send a test email to the generated address"
echo "   4. Check if it appears in the interface"
echo ""
echo "❓ If you encounter issues:"
echo "   - Check browser console for errors"
echo "   - Verify API is accessible: curl https://$DOMAIN/api/health"
echo "   - Check PM2 logs: pm2 logs"
echo "   - Review Nginx logs: tail -f /var/log/nginx/error.log"
echo ""
echo "📚 Documentation: https://github.com/tacssuki/EphemeralMail-svelte"

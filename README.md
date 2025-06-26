<div align="center">
  <img src="https://raw.githubusercontent.com/tacssuki/EphemeralMail-svelte/main/public/eemail.png" alt="EphemeralMail Logo" width="128" height="128">
  <h1>EphemeralMail Frontend</h1>
  <p><strong>Optional Modern Web Interface for EphemeralMail API</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

## 🎯 **Optional Frontend for EphemeralMail**

This is a **completely optional** web interface for the [EphemeralMail Backend API](https://github.com/tacssuki/EphemeralMail). 

**You don't need this frontend to use EphemeralMail!** The backend API works perfectly with:
- Your own custom frontend
- Mobile apps  
- CLI tools
- Direct API integration

### ✨ Why Use This Frontend?

- 🎨 **Beautiful Interface** - Modern, clean design that's a pleasure to use
- 📱 **Mobile-First** - Responsive design that works perfectly on all devices
- ⚡ **Lightning Fast** - Built with Svelte and Vite for optimal performance
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📧 **Real-time Updates** - Live email checking and updates
- 💾 **Smart Storage** - Local storage with backend synchronization
- 🔄 **PWA Ready** - Progressive Web App capabilities
- 📧 **Real-time Updates** - Live email checking and updates
- 💾 **Smart Storage** - Local storage with backend synchronization
- 🔄 **PWA Ready** - Progressive Web App capabilities
- 🎯 **Smart Navigation** - Three-panel layout optimized for all screen sizes

---

## 📋 **Prerequisites**

**Required:**
- [EphemeralMail Backend](https://github.com/tacssuki/EphemeralMail) running
- Node.js 18+

**The backend MUST be running before you can use this frontend!**

---

## 🚀 **Quick Deployment Guide**

This guide helps you avoid the common pitfalls we encountered during deployment.

### Option 1: Production VPS Deployment (Recommended)

**Step 1: Deploy the Backend First**
```bash
# On your VPS - Deploy the backend API first
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail
sudo ./deploy.sh yourdomain.com
```

**Step 2: Deploy the Frontend**
```bash
# On your VPS - Deploy this frontend
git clone https://github.com/tacssuki/EphemeralMail-svelte.git
cd EphemeralMail-svelte

# Configure for production
cp .env.example .env
nano .env
```

**Step 3: Configure Environment**
```env
# .env file
VITE_API_URL=https://yourdomain.com
```

**⚠️ CRITICAL:** Make sure `VITE_API_URL` does NOT end with `/api` - just your domain!

**Step 4: Build and Deploy**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Create deployment directory
sudo mkdir -p /opt/ephemeral-mail-frontend
sudo cp -r dist/* /opt/ephemeral-mail-frontend/
sudo chown -R www-data:www-data /opt/ephemeral-mail-frontend

# Install PM2 for serving
sudo npm install -g pm2 serve

# Start serving the frontend
pm2 serve /opt/ephemeral-mail-frontend 3000 --name "ephemeral-mail-frontend" --spa
pm2 startup
pm2 save
```

**Step 5: Configure Nginx**

Add to your Nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL configuration (already set up by backend deploy.sh)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # API routes (backend)
    location /api/ {
        proxy_pass http://localhost:4444/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (serves from root)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Step 6: Test and Verify**
```bash
# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Test the frontend
curl -I https://yourdomain.com
# Should return 200 OK

# Test API through frontend
curl -I https://yourdomain.com/api/health
# Should return 200 OK

# Check PM2 status
pm2 status
```

### Option 2: Local Development

**Step 1: Start Backend**
```bash
# In terminal 1 - Start the backend
cd /path/to/EphemeralMail
npm run dev
# Backend runs on http://localhost:4444
```

**Step 2: Start Frontend**
```bash
# In terminal 2 - Start the frontend
cd /path/to/EphemeralMail-svelte
npm install

# Configure for local development (optional)
cp .env.example .env
# Edit .env if your backend runs on different port

# Start development server
npm run dev
# Frontend runs on http://localhost:4173
```

**Step 3: Visit and Test**
- Open http://localhost:4173
- Generate a test email
- Send an email to that address
- Check if it appears in the interface

---

## ⚙️ **Configuration**

### Environment Variables

Create a `.env` file:

```env
# API Configuration
VITE_API_URL=https://yourdomain.com

# Development alternatives:
# VITE_API_URL=http://localhost:4444
# VITE_API_URL=https://api.yourdomain.com
```

**Important Notes:**
- ✅ **Correct**: `VITE_API_URL=https://yourdomain.com` 
- ❌ **Wrong**: `VITE_API_URL=https://yourdomain.com/api`
- ❌ **Wrong**: `VITE_API_URL=https://yourdomain.com/api/`

The frontend automatically appends `/api` to the base URL.

### Backend CORS Configuration

Ensure your backend's `.env` includes your frontend domain:

```env
# In your backend's .env file
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:4173,http://localhost:3000
```

---

## 🎨 **Interface Overview**

### Three-Panel Layout

**🗂️ Left Panel: Email Addresses (320px)**
- List of all generated temporary email addresses
- Click to select and view emails for that address
- Copy email address to clipboard button
- Generate new email addresses button
- Dark mode toggle (desktop)

**📥 Middle Panel: Email Inbox (320px)**
- Shows emails received for the selected email address
- Email preview with subject, sender, and timestamp
- Unread email indicators (blue dots)
- Refresh and delete options
- Dark mode support

**📖 Right Panel: Email Viewer (Remaining space)**
- Full email content display with maximum space
- Support for both HTML and text emails
- Attachment information
- Email metadata (from, to, date)
- Dark mode optimized typography

### Features

- **Smart Mobile Layout** - Panels stack and adapt on smaller screens
- **Dark Mode** - Automatic system detection + manual toggle
- **Real-time Updates** - Emails refresh every 30 seconds
- **Local Storage** - Remembers your email addresses between visits
- **Copy to Clipboard** - One-click copying of email addresses
- **Email Management** - Delete individual emails or entire addresses

---

## 🧪 **Testing Your Deployment**

### 1. Frontend Health Check
```bash
# Test frontend loading
curl -I https://yourdomain.com
# Should return: 200 OK

# Test that it serves the app
curl https://yourdomain.com | grep "EphemeralMail"
# Should find the app title
```

### 2. API Integration Test
```bash
# Test API through the same domain
curl https://yourdomain.com/api/health
# Should return: {"status": "healthy", ...}

# Test CORS by checking response headers
curl -I -H "Origin: https://yourdomain.com" https://yourdomain.com/api/health
# Should include: Access-Control-Allow-Origin: https://yourdomain.com
```

### 3. End-to-End Test

1. **Visit your frontend**: https://yourdomain.com
2. **Generate email**: Click "Generate New Email"
3. **Send test email**: Use sendmail or another email client
4. **Check reception**: Email should appear in the interface within 30 seconds

**Manual test email:**
```bash
# Replace with your generated email address
echo "Subject: Test Email

This is a test email from the deployment." | sendmail your-generated-email@yourdomain.com
```

---

## 🔧 **Build & Deployment Scripts**

### Development Scripts
```bash
npm run dev          # Start development server (port 4173)
npm run dev:3000     # Start development server (port 3000)
npm run dev:5173     # Start development server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Production Build Process
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Build for production
npm run build
# Creates optimized files in dist/

# 4. Test production build locally
npm run preview
# Serves on http://localhost:4173

# 5. Deploy to server
# Copy dist/ contents to your web server
```

### Automated Deployment Script

Use the included deployment script:
```bash
#!/bin/bash

DOMAIN=${1:-localhost}
FRONTEND_DIR="/opt/ephemeral-mail-frontend"

echo "🎨 Deploying EphemeralMail Frontend..."
echo "📍 Domain: $DOMAIN"

# Clone or update repository
if [ -d "$FRONTEND_DIR" ]; then
    echo "📦 Updating existing installation..."
    cd $FRONTEND_DIR
    git pull
else
    echo "📦 Fresh installation..."
    git clone https://github.com/tacssuki/EphemeralMail-svelte.git $FRONTEND_DIR
    cd $FRONTEND_DIR
fi

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=https://$DOMAIN" > .env

# Build for production
npm run build

# Set up serving with PM2
sudo npm install -g pm2 serve
pm2 delete ephemeral-mail-frontend 2>/dev/null || true
pm2 serve dist 3000 --name "ephemeral-mail-frontend" --spa
pm2 startup
pm2 save

echo "✅ Frontend deployed successfully!"
echo "🌐 Configure Nginx to proxy / to http://localhost:3000"
echo "🔗 Frontend will be available at: https://$DOMAIN"
```

Usage:
```bash
chmod +x deploy.sh
sudo ./deploy.sh yourdomain.com
```

---

## 🐛 **Troubleshooting**

### Common Issues & Solutions

**1. Frontend loads but can't connect to API**

```bash
# Check API URL configuration
cat .env
# Should show: VITE_API_URL=https://yourdomain.com (no /api at the end)

# Check if API is accessible
curl https://yourdomain.com/api/health

# Check browser network tab for CORS errors
# Open browser dev tools → Network tab → look for red entries
```

**2. CORS errors in browser console**

```bash
# Check backend CORS configuration
ssh your-vps
cd /opt/ephemeral-mail
grep ALLOWED_ORIGINS .env
# Should include your frontend domain

# Update backend CORS
echo "ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:4173" >> .env
pm2 restart ephemeral-mail
```

**3. Frontend not loading (404 errors)**

```bash
# Check if frontend service is running
pm2 status

# Check if PM2 is serving files correctly
curl -I http://localhost:3000
# Should return 200 OK

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

**4. Build errors**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
# Should be 18+

# Build with verbose output
npm run build -- --verbose
```

**5. API calls return wrong URLs**

```bash
# Check built files for localhost references
grep -r "localhost" dist/
# Should not find any localhost references in production build

# Rebuild after fixing .env
rm -rf dist/
npm run build
```

### Debug Mode

Enable debug mode by adding to your `.env`:
```env
VITE_DEBUG=true
```

This will:
- Show API URLs in console
- Display more detailed error messages
- Log all API requests and responses

---

## 🌐 **Alternative Deployment Options**

### Static Hosting (Netlify, Vercel, etc.)

**For Netlify:**
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (in Netlify dashboard)
VITE_API_URL=https://yourdomain.com
```

**For Vercel:**
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables (in Vercel dashboard)
VITE_API_URL=https://yourdomain.com
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /opt/ephemeral-mail-frontend
    
    # SSL configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # API proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:4444/
    ProxyPassReverse /api/ http://localhost:4444/
    
    # Frontend (SPA routing)
    <Directory "/opt/ephemeral-mail-frontend">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

---

## 🔐 **Security Considerations**

### Content Security Policy

The frontend is built with security in mind:

```html
<!-- Automatically included in production builds -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://yourdomain.com;">
```

### HTTPS Requirements

- **Always use HTTPS in production**
- **Never serve the frontend over HTTP with an HTTPS API**
- **The deployment script sets up SSL automatically**

### Environment Variables Security

- ✅ `VITE_*` variables are safe for frontend use
- ❌ Never put secrets in `VITE_*` variables
- ✅ API authentication is handled by the backend

---

## 🚀 **Performance Optimization**

### Build Optimization

The production build is already optimized:
- **Tree shaking** removes unused code
- **Minification** reduces file sizes
- **Code splitting** enables lazy loading
- **Asset optimization** compresses images and icons

### Serving Optimization

**Nginx Caching:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /index.html {
    add_header Cache-Control "no-cache";
}
```

**Gzip Compression:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

---

## 📱 **PWA Features**

### Progressive Web App Capabilities

The frontend includes PWA features:
- **App manifest** for installability
- **Service worker** for offline functionality  
- **Icons** for home screen installation
- **Responsive design** for all devices

### Installation

Users can install the app by:
1. Opening the site in a browser
2. Clicking the "Install App" button (appears automatically)
3. Or using browser menu → "Install App"

---

## 🛠️ **Development**

### Local Development Setup

```bash
# Prerequisites: Node.js 18+, running EphemeralMail backend

# Clone and install
git clone https://github.com/tacssuki/EphemeralMail-svelte.git
cd EphemeralMail-svelte
npm install

# Configure for local development
cp .env.example .env
# Edit .env if needed (default works with standard backend setup)

# Start development server
npm run dev
# Open http://localhost:4173
```

### Project Structure

```
src/
├── lib/
│   ├── api.js                 # API service for backend communication
│   ├── EmailApp.svelte        # Main 3-panel layout component
│   ├── Dialog.svelte          # Reusable dialog component
│   ├── dialogStore.js         # Dialog state management
│   └── storage.js             # Local storage utilities
├── App.svelte                 # Root application component
├── main.js                    # Application entry point
└── app.css                    # Global styles and Tailwind imports

public/
├── eemail.png                 # App logo
└── manifest.json              # PWA manifest

Configuration files:
├── vite.config.js             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── svelte.config.js           # Svelte configuration
```

### Adding Features

**Add a new component:**
```svelte
<!-- src/lib/NewComponent.svelte -->
<script>
  export let prop1;
  export let prop2 = 'default';
  
  // Component logic here
</script>

<div class="p-4 bg-white dark:bg-gray-800 rounded-lg">
  <h2 class="text-lg font-semibold">{prop1}</h2>
  <p class="text-gray-600 dark:text-gray-300">{prop2}</p>
</div>
```

**Extend the API service:**
```javascript
// src/lib/api.js
export async function newApiFunction(param) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/new-endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ param }),
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## 📚 **Related Projects**

- **[EphemeralMail Backend](https://github.com/tacssuki/EphemeralMail)** - The API this frontend connects to
- **Build your own frontend** - Use any framework with the EphemeralMail API

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test with the EphemeralMail backend
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Test all features with the backend
- Ensure responsive design works on all screen sizes
- Test both light and dark modes
- Update documentation for new features

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🆘 **Support & Help**

### Getting Help

- **Frontend Issues**: Create an issue in this repository
- **Backend/API Issues**: Create an issue in the [EphemeralMail repository](https://github.com/tacssuki/EphemeralMail)
- **Integration Issues**: Check both repositories or ask in discussions

### Before Asking for Help

1. **Check this README** - especially the troubleshooting section
2. **Verify backend is running** - test `https://yourdomain.com/api/health`
3. **Check browser console** - look for JavaScript errors or network failures
4. **Check CORS configuration** - common source of issues
5. **Test API directly** - ensure the backend works before debugging frontend

### Useful Debug Commands

```bash
# Check frontend build
npm run build 2>&1 | tee build.log

# Check API connectivity  
curl -v https://yourdomain.com/api/health

# Check CORS headers
curl -I -H "Origin: https://yourdomain.com" https://yourdomain.com/api/health

# Check PM2 services
pm2 status
pm2 logs ephemeral-mail-frontend

# Check Nginx configuration
sudo nginx -t
```

---

<div align="center">
  <p>⭐ Star this repo if you find it useful!</p>
  <p>🔗 <a href="https://github.com/tacssuki/EphemeralMail">Backend API</a> | <a href="https://github.com/tacssuki/EphemeralMail-svelte/issues">Report Issues</a> | <a href="https://github.com/tacssuki/EphemeralMail-svelte/discussions">Discussions</a></p>
</div>

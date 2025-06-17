#!/bin/bash

# Update script for existing EphemeralMail Frontend installations
# Usage: ./update.sh
# Run this from your frontend installation directory: cd /opt/ephemeral-mail-frontend && ./update.sh

set -e

FRONTEND_DIR="/opt/ephemeral-mail-frontend"
PM2_APP_NAME="ephemeral-mail-frontend"
CURRENT_DIR=$(pwd)

echo "🔄 EphemeralMail Frontend Update Script"
echo "📍 Current directory: $CURRENT_DIR"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run from your EphemeralMail Frontend installation directory."
    echo "💡 Expected location: $FRONTEND_DIR"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Please install PM2: sudo npm install -g pm2"
    exit 1
fi

# Stop PM2 process if running
echo "⏹️  Stopping frontend service..."
pm2 stop $PM2_APP_NAME 2>/dev/null || true

# Update code
echo "📥 Updating code from GitHub..."
git stash || true
git pull origin main
git stash pop || true

# Install dependencies and build
echo "🔨 Building application..."
npm install
npm run build

# Restart PM2 service
echo "🔄 Restarting frontend service..."
pm2 start $PM2_APP_NAME 2>/dev/null || {
    echo "Starting new PM2 process..."
    pm2 serve dist 3000 --name "$PM2_APP_NAME" --spa
}

# Ensure PM2 saves the process list
pm2 save

echo "✅ Frontend update completed!"
echo ""
echo "🔧 Useful commands:"
echo "  - Check status: pm2 status"
echo "  - View logs: pm2 logs $PM2_APP_NAME"
echo "  - Restart: pm2 restart $PM2_APP_NAME"
echo ""
echo "🌐 Frontend should be accessible at your configured domain"

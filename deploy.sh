#!/bin/bash

# Simple CDN Test Website Deployment Script
# Usage: ./deploy.sh

set -e

VPS_IP="37.152.176.173"
VPS_USER="ubuntu"
DOMAIN="test-verge-test.shop"
APP_NAME="cdn-test-website"

echo "🚀 Deploying CDN Test Website"
echo "📍 Target: $VPS_USER@$VPS_IP"
echo "🌐 Domain: $DOMAIN"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check SSH connection
print_status "Checking VPS connection..."
if ! ssh -o ConnectTimeout=10 $VPS_USER@$VPS_IP "echo 'Connected'" > /dev/null 2>&1; then
    print_error "Cannot connect to VPS. Please check SSH connection."
    exit 1
fi

# Copy files to VPS
print_status "Copying files to VPS..."
ssh $VPS_USER@$VPS_IP "mkdir -p /home/$VPS_USER/$APP_NAME"

if command -v rsync &> /dev/null; then
    rsync -avz --exclude 'node_modules' --exclude '.git' \
        ./ $VPS_USER@$VPS_IP:/home/$VPS_USER/$APP_NAME/
else
    scp -r . $VPS_USER@$VPS_IP:/home/$VPS_USER/$APP_NAME/
fi

# Setup on VPS
print_status "Setting up on VPS..."
ssh $VPS_USER@$VPS_IP << EOF
cd /home/$VPS_USER/$APP_NAME

# Update system
sudo apt-get update -qq

# Install Node.js 18
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Install nginx
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

# Install dependencies
npm install

# Configure nginx
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Serve static assets with long cache
    location /assets/ {
        alias /home/$VPS_USER/$APP_NAME/assets/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Served-By "direct-server";
        
        # Enable CORS for assets
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
    }

    # Serve public static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /home/$VPS_USER/$APP_NAME/public;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Served-By "direct-server";
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Add custom header to identify direct server
        add_header X-Served-By "direct-server";
    }

    # Main website
    location / {
        root /home/$VPS_USER/$APP_NAME/public;
        try_files \$uri \$uri/ /index.html;
        
        # Cache HTML files for a short time
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, max-age=3600";
            add_header X-Served-By "direct-server";
        }
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
        add_header X-Served-By "direct-server";
    }
}
NGINX_CONFIG

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

# Start application with PM2
pm2 delete $APP_NAME || true
pm2 start server.js --name $APP_NAME
pm2 save
pm2 startup | grep "sudo" | bash || true

# Configure firewall
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

echo "✅ Setup completed!"
EOF

# Health check
print_status "Checking deployment..."
sleep 3

if curl -f -s http://$VPS_IP/health > /dev/null; then
    print_status "✅ Deployment successful!"
    print_status "🌐 Website: http://$DOMAIN (or http://$VPS_IP)"
    print_status "🏥 Health: http://$VPS_IP/health"
else
    print_warning "⚠️ Deployment completed but health check failed"
    print_warning "Check logs: ssh $VPS_USER@$VPS_IP 'pm2 logs $APP_NAME'"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Point DNS for $DOMAIN to $VPS_IP"
echo "2. Add $DOMAIN to your CDN provider"
echo "3. Configure CDN settings in provider dashboard"
echo "4. Test CDN features using the website"
echo ""
echo "🔧 Management Commands:"
echo "  Status: ssh $VPS_USER@$VPS_IP 'pm2 status'"
echo "  Logs: ssh $VPS_USER@$VPS_IP 'pm2 logs $APP_NAME'"
echo "  Restart: ssh $VPS_USER@$VPS_IP 'pm2 restart $APP_NAME'"
echo ""

print_status "Deployment completed! 🎉"

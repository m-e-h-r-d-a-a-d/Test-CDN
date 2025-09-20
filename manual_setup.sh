#!/bin/bash

# Manual setup script to run on the server
VPS_USER="ubuntu"
APP_NAME="cdn-test-website"

echo "🚀 Setting up CDN Test Website on server..."

cd /home/$VPS_USER/$APP_NAME

# Update system
sudo apt-get update -qq

# Install Node.js 18 if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

# Install dependencies
npm install

# Configure nginx
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name test-verge-test.shop www.test-verge-test.shop;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Serve static assets with long cache
    location /assets/ {
        alias /home/ubuntu/cdn-test-website/assets/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Served-By "direct-server";
        
        # Enable CORS for assets
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
    }

    # Serve public static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /home/ubuntu/cdn-test-website/public;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Served-By "direct-server";
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add custom header to identify direct server
        add_header X-Served-By "direct-server";
    }

    # Main website
    location / {
        root /home/ubuntu/cdn-test-website/public;
        try_files $uri $uri/ /index.html;
        
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
echo "🌐 Website should be available at: http://test-verge-test.shop"
echo "🏥 Health check: http://37.152.176.173/health"

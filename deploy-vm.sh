#!/bin/bash

# Helium Inviter VM Deployment Script
# Run this script on your VM to set up the application

set -e

echo "🚀 Starting Helium Inviter VM Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y

# Install Git
print_status "Installing Git..."
sudo apt install git -y

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www/helium-inviter
sudo chown -R $USER:$USER /var/www/helium-inviter

# Clone repository (you'll need to update this with your actual repo URL)
print_status "Cloning repository..."
cd /var/www/helium-inviter
if [ ! -d ".git" ]; then
    echo "Please clone your repository manually:"
    echo "git clone https://github.com/yourusername/helium-inviter.git /var/www/helium-inviter"
    echo "Then run this script again."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Copy server package.json
print_status "Setting up server dependencies..."
cp server-package.json package.json
npm install

# Build frontend
print_status "Building frontend..."
npm run build

# Create PM2 log directory
print_status "Setting up PM2 logging..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Create environment file template
print_status "Creating environment file template..."
if [ ! -f ".env" ]; then
    cp server-env-template.txt .env
    print_warning "Please edit .env file with your actual configuration:"
    print_warning "nano .env"
    print_warning "Then run: pm2 start ecosystem.config.js"
else
    print_success "Environment file already exists"
fi

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/admin.he2.ai > /dev/null <<EOF
server {
    listen 80;
    server_name admin.he2.ai;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" always;

    # Frontend static files
    location / {
        root /var/www/helium-inviter/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3002/api/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/admin.he2.ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
print_status "Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Setup PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup

print_success "Deployment setup completed!"
print_warning "Next steps:"
print_warning "1. Edit your .env file: nano .env"
print_warning "2. Start the application: pm2 start ecosystem.config.js"
print_warning "3. Setup SSL certificate: sudo certbot --nginx -d admin.he2.ai"
print_warning "4. Test the application: curl http://admin.he2.ai/api/health"

print_success "Your Helium Inviter application is ready for deployment!"



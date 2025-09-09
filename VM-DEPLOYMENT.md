# Helium Inviter VM Deployment Guide

This guide will help you deploy the Helium Inviter application on a VM with Nginx as a reverse proxy.

## Files Created for VM Deployment

- `server.js` - Main Express.js server with email functionality
- `server-package.json` - Updated with all required dependencies
- `server-env-template.txt` - Environment variables template
- `ecosystem.config.js` - PM2 configuration for production
- `deploy-vm.sh` - Automated deployment script

## Quick Deployment

### 1. Upload Files to VM

```bash
# Upload your project to the VM
scp -r . user@your-vm-ip:/var/www/helium-inviter/
```

### 2. Run Deployment Script

```bash
# SSH into your VM
ssh user@your-vm-ip

# Navigate to project directory
cd /var/www/helium-inviter

# Run deployment script
./deploy-vm.sh
```

### 3. Configure Environment

```bash
# Edit environment file
nano .env
```

Add your configuration:
```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://admin.he2.ai

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Team Helium <your-email@gmail.com>
```

### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
```

### 5. Setup SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d admin.he2.ai
```

## Manual Deployment Steps

If you prefer manual setup:

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### 2. Application Setup

```bash
# Create directory
sudo mkdir -p /var/www/helium-inviter
sudo chown -R $USER:$USER /var/www/helium-inviter

# Clone repository
cd /var/www/helium-inviter
git clone https://github.com/yourusername/helium-inviter.git .

# Install dependencies
npm install
cp server-package.json package.json
npm install

# Build frontend
npm run build
```

### 3. Configure Environment

```bash
# Copy template and edit
cp server-env-template.txt .env
nano .env
```

### 4. Setup PM2

```bash
# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/admin.he2.ai
```

Add the configuration from the deployment script.

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/admin.he2.ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. Setup Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## API Endpoints

The server provides the following endpoints:

- `GET /api/health` - Health check
- `GET /api/invite-codes` - Get all invite codes
- `POST /api/generate-codes` - Generate new invite codes
- `POST /api/send-invite-email` - Send invite email
- `GET /api/dashboard-stats` - Get dashboard statistics
- `DELETE /api/invite-codes/:id` - Delete invite code
- `POST /api/test-email` - Send test email

## Monitoring and Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status

# PM2 logs
pm2 logs helium-inviter-server

# Nginx status
sudo systemctl status nginx

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Application

```bash
# Restart PM2 process
pm2 restart helium-inviter-server

# Restart Nginx
sudo systemctl restart nginx
```

### Update Application

```bash
# Pull latest changes
cd /var/www/helium-inviter
git pull origin main

# Rebuild frontend
npm run build

# Restart application
pm2 restart helium-inviter-server
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Check if another process is using port 3001
2. **Permission denied**: Ensure proper file permissions
3. **Email not sending**: Check SMTP configuration in .env
4. **Database connection**: Verify Supabase credentials

### Logs

```bash
# Application logs
pm2 logs helium-inviter-server

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

## Security Considerations

1. **Firewall**: Only allow necessary ports
2. **SSL**: Always use HTTPS in production
3. **Environment**: Keep .env file secure
4. **Updates**: Regularly update system packages
5. **Monitoring**: Set up log monitoring

## Backup

Create a backup script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/helium-inviter"
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/helium-inviter_$DATE.tar.gz /var/www/helium-inviter
find $BACKUP_DIR -name "helium-inviter_*.tar.gz" -mtime +7 -delete
```

Add to crontab for daily backups:

```bash
sudo crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

Your Helium Inviter application is now ready for production deployment!

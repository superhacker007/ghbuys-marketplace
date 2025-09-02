#!/bin/bash

# GH Buys Production Setup Script
# Run this on the Linode server as root

echo "🇬🇭 Setting up GH Buys Marketplace for Production..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx

# Copy Nginx configuration
echo "⚙️  Setting up Nginx configuration..."
cp /root/ghbuys/nginx-ghbuys.conf /etc/nginx/sites-available/ghbuys
ln -sf /etc/nginx/sites-available/ghbuys /etc/nginx/sites-enabled/ghbuys

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Configure firewall
echo "🛡️  Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3000  # Keep for direct access if needed
ufw status

# Start and enable Nginx
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Obtain SSL certificate (will need manual DNS verification)
echo "🔒 Setting up SSL certificate..."
echo "Note: You'll need to point ghbuys.com to this server's IP first"
echo "Current server IP: 172.235.149.187"
echo ""
echo "After DNS is configured, run:"
echo "certbot --nginx -d ghbuys.com -d www.ghbuys.com"

# Set up log rotation
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/ghbuys << EOF
/var/log/nginx/ghbuys-*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Create systemd service for the Node.js app (backup to PM2)
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/ghbuys.service << EOF
[Unit]
Description=GH Buys Marketplace
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ghbuys
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ghbuys

echo "✅ Production setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Point ghbuys.com DNS to this server IP: 172.235.149.187"
echo "2. Run: certbot --nginx -d ghbuys.com -d www.ghbuys.com"
echo "3. Update environment variables in /root/ghbuys/.env with production values"
echo "4. Restart services: systemctl restart ghbuys nginx"
echo ""
echo "🌍 Your marketplace will be available at: https://ghbuys.com"
echo "👑 Admin dashboard: https://ghbuys.com/app"
echo "🏥 Health check: https://ghbuys.com/health"
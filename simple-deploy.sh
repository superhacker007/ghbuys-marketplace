#!/bin/bash

# Simple GH Buys Deployment Script for Linode
# This script installs and runs the new Express.js marketplace

set -e

echo "🇬🇭 Deploying GH Buys Simple Marketplace..."
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

print_info "Step 1: Installing Node.js and PostgreSQL"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs postgresql postgresql-contrib nginx

print_status "Node.js and PostgreSQL installed"

print_info "Step 2: Setting up database"
sudo -u postgres psql << 'EOF'
CREATE USER ghbuys_user WITH PASSWORD 'GhBuys2024!SecurePassword';
CREATE DATABASE ghbuys_prod OWNER ghbuys_user;
GRANT ALL PRIVILEGES ON DATABASE ghbuys_prod TO ghbuys_user;
\q
EOF

print_status "Database setup completed"

print_info "Step 3: Creating application user"
useradd -m -s /bin/bash ghbuys || true
mkdir -p /opt/ghbuys
chown -R ghbuys:ghbuys /opt/ghbuys

print_status "Application user created"

print_info "Step 4: Setting up firewall"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

print_status "Firewall configured"

print_info "Step 5: Installing PM2 globally"
npm install -g pm2

print_status "PM2 installed"

echo ""
print_status "🎉 Server setup completed!"
echo ""
print_info "Next steps:"
echo "1. su - ghbuys"
echo "2. cd /opt/ghbuys"
echo "3. git clone https://github.com/superhacker007/ghbuys-marketplace.git ."
echo "4. npm install"
echo "5. npm run build"
echo "6. npm start"
echo ""
print_info "Your marketplace will be running on port 3000"
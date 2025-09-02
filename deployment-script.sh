#!/bin/bash

# GH Buys Linode Deployment Script
# Run this script on your Linode server

set -e  # Exit on any error

echo "🇬🇭 Starting GH Buys Marketplace deployment on Linode..."
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. Consider creating a non-root user for better security."
fi

print_info "Step 1: System Information"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disk Space: $(df -h / | awk 'NR==2 {print $4 " available"}')"
echo "CPU: $(nproc) cores"

print_info "Step 2: Updating system packages"
apt update && apt upgrade -y
print_status "System updated"

print_info "Step 3: Installing essential packages"
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban
print_status "Essential packages installed"

print_info "Step 4: Setting up firewall"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
print_status "Firewall configured"

print_info "Step 5: Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
print_status "Node.js installed: $(node --version)"

print_info "Step 6: Installing PostgreSQL 15"
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt update
apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15
systemctl start postgresql
systemctl enable postgresql
print_status "PostgreSQL installed and started"

print_info "Step 7: Installing Redis"
apt install -y redis-server
systemctl start redis-server
systemctl enable redis-server
print_status "Redis installed and started"

print_info "Step 8: Installing Nginx"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
print_status "Nginx installed and started"

print_info "Step 9: Installing PM2 globally"
npm install -g pm2
print_status "PM2 installed"

print_info "Step 10: Creating application directory"
mkdir -p /opt/ghbuys
mkdir -p /opt/backups/ghbuys
mkdir -p /var/log/ghbuys
print_status "Directories created"

print_info "Step 11: Creating ghbuys user"
if ! id "ghbuys" &>/dev/null; then
    useradd -m -s /bin/bash ghbuys
    usermod -aG sudo ghbuys
    chown -R ghbuys:ghbuys /opt/ghbuys
    chown -R ghbuys:ghbuys /var/log/ghbuys
    print_status "User 'ghbuys' created"
else
    print_info "User 'ghbuys' already exists"
fi

print_info "Step 12: Setting up PostgreSQL database"
sudo -u postgres psql << 'EOF'
CREATE USER ghbuys_user WITH PASSWORD 'GhBuys2024!SecurePassword';
CREATE DATABASE ghbuys_prod OWNER ghbuys_user;
GRANT ALL PRIVILEGES ON DATABASE ghbuys_prod TO ghbuys_user;
\q
EOF
print_status "PostgreSQL database created"

print_info "Step 13: Configuring PostgreSQL for production"
PG_CONF="/etc/postgresql/15/main/postgresql.conf"
cp $PG_CONF $PG_CONF.backup

cat >> $PG_CONF << 'EOF'

# GH Buys Production Settings
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
EOF

systemctl restart postgresql
print_status "PostgreSQL configured for production"

print_info "Step 14: Configuring Redis for production"
REDIS_CONF="/etc/redis/redis.conf"
cp $REDIS_CONF $REDIS_CONF.backup

sed -i 's/# maxmemory <bytes>/maxmemory 512mb/' $REDIS_CONF
sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' $REDIS_CONF
sed -i 's/save 900 1/#save 900 1/' $REDIS_CONF
sed -i 's/save 300 10/#save 300 10/' $REDIS_CONF
sed -i 's/save 60 10000/#save 60 10000/' $REDIS_CONF
echo "save 900 1" >> $REDIS_CONF
echo "save 300 10" >> $REDIS_CONF

systemctl restart redis-server
print_status "Redis configured for production"

print_info "Step 15: Installing Certbot for SSL"
apt install -y certbot python3-certbot-nginx
print_status "Certbot installed"

echo ""
print_status "🎉 Server preparation complete!"
echo ""
print_info "Next steps:"
echo "1. Clone your GH Buys repository to /opt/ghbuys"
echo "2. Configure environment variables"
echo "3. Run database migrations"
echo "4. Configure Nginx"
echo "5. Setup SSL certificate"
echo ""
print_info "Run the following commands to continue:"
echo "su - ghbuys"
echo "cd /opt/ghbuys"
echo ""
print_warning "Please provide your:"
echo "- Domain name for SSL setup"
echo "- Paystack production keys"
echo "- Email for SSL certificate"
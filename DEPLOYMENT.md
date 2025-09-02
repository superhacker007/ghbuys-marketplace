# 🚀 GH Buys Deployment Guide

Complete guide for deploying GH Buys marketplace to production in Ghana.

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] **Server**: 4+ CPU cores, 8GB+ RAM, 100GB+ SSD
- [ ] **Database**: PostgreSQL 15+ with 2GB+ RAM allocated
- [ ] **Cache**: Redis 7+ with 1GB+ RAM
- [ ] **CDN**: CloudFlare or similar for Ghana
- [ ] **SSL**: Certificate from Let's Encrypt or commercial
- [ ] **Domain**: `.com.gh` domain recommended for Ghana

### Ghana-Specific Requirements
- [ ] **Business Registration**: Valid Ghana business registration
- [ ] **Paystack Account**: Production keys from Paystack Ghana
- [ ] **Bank Account**: Ghana-based business bank account
- [ ] **Tax Registration**: VAT and TIN numbers
- [ ] **Data Compliance**: Ghana Data Protection Act compliance

## 🏗️ Architecture Overview

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Load Balancer     │    │   Application       │    │   Database          │
│   (Nginx/Caddy)     │────│   (Node.js/Medusa)  │────│   (PostgreSQL)      │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                           ┌─────────────────────┐
                           │   Cache & Queue     │
                           │   (Redis)           │
                           │                     │
                           └─────────────────────┘
```

## 🌍 Production Environment Setup

### 1. Server Provisioning

#### Option A: Cloud Providers in Ghana
```bash
# Recommended Ghana cloud providers
- Ghana Cloud
- Vodafone Business Cloud
- MTN Business Cloud
```

#### Option B: International with Ghana Edge
```bash
# AWS Regions (closest to Ghana)
- eu-west-1 (Ireland)
- us-east-1 (Virginia)

# Digital Ocean
- London (LON1)
- Frankfurt (FRA1)
```

#### Option C: Local Data Centers
```bash
# Ghana data center providers
- MainOne Ghana
- Open Access Data Centres (OADC)
- Vodafone Data Center
```

### 2. Domain & DNS Configuration

```bash
# Register Ghana domain
whois ghbuys.com.gh

# DNS Configuration (CloudFlare recommended)
A      ghbuys.com.gh           → YOUR_SERVER_IP
A      www.ghbuys.com.gh       → YOUR_SERVER_IP
A      admin.ghbuys.com.gh     → YOUR_SERVER_IP
A      api.ghbuys.com.gh       → YOUR_SERVER_IP
CNAME  vendor.ghbuys.com.gh    → ghbuys.com.gh
```

### 3. Server Security Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Install fail2ban
sudo apt install fail2ban -y

# Configure SSH (disable root login)
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no

# Restart SSH
sudo systemctl restart ssh
```

## 🔧 Application Deployment

### 1. Environment Configuration

Create production environment file:
```bash
# /opt/ghbuys/.env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://ghbuys_user:SECURE_PASSWORD@localhost:5432/ghbuys_prod

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=GENERATE_STRONG_JWT_SECRET_64_CHARS
COOKIE_SECRET=GENERATE_STRONG_COOKIE_SECRET_64_CHARS

# Paystack (PRODUCTION KEYS)
PAYSTACK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PRODUCTION_PUBLIC_KEY
PAYSTACK_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# URLs
MEDUSA_BACKEND_URL=https://api.ghbuys.com.gh
STORE_CORS=https://ghbuys.com.gh,https://www.ghbuys.com.gh
ADMIN_CORS=https://admin.ghbuys.com.gh
AUTH_CORS=https://admin.ghbuys.com.gh

# Ghana Business Info
BUSINESS_NAME=GH Buys Marketplace Ltd
BUSINESS_ADDRESS=123 Oxford Street, Osu, Accra, Ghana
SUPPORT_EMAIL=support@ghbuys.com.gh
SUPPORT_PHONE=+233-30-123-4567

# Email (Production SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@ghbuys.com.gh
SMTP_PASSWORD=APP_SPECIFIC_PASSWORD
EMAIL_FROM=GH Buys <noreply@ghbuys.com.gh>

# Admin
ADMIN_EMAIL=admin@ghbuys.com.gh
ADMIN_PASSWORD=GENERATE_STRONG_ADMIN_PASSWORD

# File uploads
UPLOAD_DIR=/opt/ghbuys/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# Logging
LOG_LEVEL=info
```

### 2. Database Setup

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql << EOF
CREATE USER ghbuys_user WITH PASSWORD 'SECURE_PASSWORD';
CREATE DATABASE ghbuys_prod OWNER ghbuys_user;
GRANT ALL PRIVILEGES ON DATABASE ghbuys_prod TO ghbuys_user;
\q
EOF

# Configure PostgreSQL for production
sudo nano /etc/postgresql/15/main/postgresql.conf
# max_connections = 200
# shared_buffers = 256MB
# effective_cache_size = 2GB
# work_mem = 4MB
# maintenance_work_mem = 64MB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis for production
sudo nano /etc/redis/redis.conf
# maxmemory 1gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

# Restart Redis
sudo systemctl restart redis-server
```

### 4. Application Deployment

```bash
# Create deployment directory
sudo mkdir -p /opt/ghbuys
sudo chown $USER:$USER /opt/ghbuys

# Clone repository
cd /opt/ghbuys
git clone YOUR_REPOSITORY .

# Install dependencies
npm ci --production

# Build application
npm run build

# Run migrations
npm run migrate

# Seed production data
npm run seed:production
```

### 5. Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ghbuys-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/pm2/ghbuys-error.log',
    out_file: '/var/log/pm2/ghbuys-out.log',
    log_file: '/var/log/pm2/ghbuys-combined.log',
    time: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Setup PM2 startup
pm2 startup
pm2 save
```

## 🌐 Web Server Configuration

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/ghbuys
server {
    listen 80;
    server_name ghbuys.com.gh www.ghbuys.com.gh;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ghbuys.com.gh www.ghbuys.com.gh;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ghbuys.com.gh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ghbuys.com.gh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API Proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin Panel
    location /app {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /uploads {
        alias /opt/ghbuys/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api {
        limit_req zone=api burst=20 nodelay;
    }
}

# Admin subdomain
server {
    listen 443 ssl http2;
    server_name admin.ghbuys.com.gh;
    
    ssl_certificate /etc/letsencrypt/live/ghbuys.com.gh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ghbuys.com.gh/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000/app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ghbuys /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d ghbuys.com.gh -d www.ghbuys.com.gh -d admin.ghbuys.com.gh

# Test renewal
sudo certbot renew --dry-run

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install -g @pm2/io

# PM2 Plus monitoring
pm2 install pm2-server-monit

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 2. System Monitoring

```bash
# Install monitoring stack
sudo apt install prometheus grafana nginx-module-vts -y

# Configure Prometheus for Ghana timezone
sudo nano /etc/prometheus/prometheus.yml
```

### 3. Error Tracking

```bash
# Install Sentry for error tracking
npm install @sentry/node @sentry/integrations

# Configure in application
export SENTRY_DSN="YOUR_SENTRY_DSN"
```

## 💳 Paystack Production Configuration

### 1. Webhook Setup

```bash
# Configure webhook URL in Paystack dashboard
Webhook URL: https://api.ghbuys.com.gh/webhooks/paystack

# Test webhook
curl -X POST https://api.ghbuys.com.gh/webhooks/paystack \
  -H "x-paystack-signature: test" \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{}}'
```

### 2. Payment Testing

```bash
# Test card payments
curl -X POST https://api.ghbuys.com.gh/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 10000,
    "currency": "GHS"
  }'

# Test mobile money
curl -X POST https://api.ghbuys.com.gh/api/payments/mobile-money \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+233244123456",
    "amount": 50.00,
    "provider": "mtn"
  }'
```

## 🔄 Backup & Recovery

### 1. Database Backup

```bash
# Create backup script
cat > /opt/ghbuys/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/ghbuys"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ghbuys_prod"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x /opt/ghbuys/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/ghbuys/backup-db.sh
```

### 2. Application Backup

```bash
# Create application backup script
cat > /opt/ghbuys/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/ghbuys"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/ghbuys/uploads/

# Backup configuration
cp /opt/ghbuys/.env.production $BACKUP_DIR/env_$DATE.bak

echo "Application backup completed: $DATE"
EOF

chmod +x /opt/ghbuys/backup-app.sh
```

## 🚨 Emergency Procedures

### 1. Database Recovery

```bash
# Restore database from backup
gunzip /opt/backups/ghbuys/db_backup_YYYYMMDD_HHMMSS.sql.gz
psql ghbuys_prod < /opt/backups/ghbuys/db_backup_YYYYMMDD_HHMMSS.sql
```

### 2. Application Rollback

```bash
# Quick rollback using PM2
pm2 stop ghbuys-api

# Restore previous version
git checkout PREVIOUS_COMMIT_HASH
npm run build

# Restart application
pm2 start ghbuys-api
```

### 3. Paystack Issues

```bash
# Check Paystack status
curl -H "Authorization: Bearer YOUR_SECRET_KEY" \
  https://api.paystack.co/transaction/verify/REFERENCE

# Switch to backup payment method if needed
export PAYSTACK_BACKUP_MODE=true
pm2 restart ghbuys-api
```

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_vendor_region ON vendor(region);
CREATE INDEX idx_vendor_category ON vendor(primary_category);
CREATE INDEX idx_product_vendor ON product(vendor_id);
CREATE INDEX idx_order_created_at ON "order"(created_at);

-- Analyze database performance
ANALYZE;
```

### 2. Application Optimization

```bash
# Enable gzip compression
sudo nano /etc/nginx/nginx.conf
# Add: gzip on; gzip_types text/plain application/json;

# Setup CDN for static assets
# Configure CloudFlare or AWS CloudFront
```

### 3. Cache Configuration

```bash
# Redis cache optimization
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET timeout 300
```

## 🔍 Health Checks & Monitoring

### 1. Application Health Check

```bash
# Create health check endpoint
cat > /opt/ghbuys/health-check.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.log('❌ Health check failed');
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log('❌ Health check error:', err.message);
  process.exit(1);
});

req.end();
EOF
```

### 2. Monitoring Dashboard

```bash
# Setup Grafana dashboard for Ghana metrics
# Include:
# - Payment success rate by Mobile Money provider
# - Regional transaction volume
# - Vendor registration rate by region
# - Customer satisfaction by city
```

## 🇬🇭 Go Live Checklist

### Pre-Launch
- [ ] **Domain**: ghbuys.com.gh configured and tested
- [ ] **SSL**: Certificate installed and auto-renewal working
- [ ] **Database**: Production data seeded and verified
- [ ] **Payments**: Paystack production keys tested
- [ ] **Mobile Money**: All three providers tested
- [ ] **Email**: SMTP configuration tested
- [ ] **Backups**: Automated backup system working
- [ ] **Monitoring**: All monitoring systems active

### Launch Day
- [ ] **DNS**: Point domain to production server
- [ ] **CDN**: Enable CloudFlare or equivalent
- [ ] **Monitoring**: Monitor all systems closely
- [ ] **Support**: Support team ready for inquiries
- [ ] **Documentation**: User guides published
- [ ] **Marketing**: Launch communications sent

### Post-Launch (48 hours)
- [ ] **Performance**: Monitor response times
- [ ] **Payments**: Verify payment processing
- [ ] **Vendors**: Monitor vendor registrations
- [ ] **Orders**: Track first orders and fulfillment
- [ ] **Support**: Review and respond to feedback
- [ ] **Scaling**: Monitor server resources

---

**🎉 Congratulations! GH Buys is now live in Ghana! 🇬🇭**

*For deployment support: deployment@ghbuys.com.gh*
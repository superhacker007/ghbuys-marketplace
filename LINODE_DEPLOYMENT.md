# 🚀 GH Buys Linode Deployment Guide

Complete step-by-step guide to deploy your GH Buys marketplace to Linode.

## 📋 Prerequisites

**What you'll need:**
- Linode server (recommended: 4GB RAM, 2 CPU, 80GB SSD)
- Domain name (recommended: `.com.gh` for Ghana)
- Paystack account with API keys
- Email for SSL certificate

## 🚀 Deployment Steps

### Step 1: Upload Scripts to Your Linode Server

First, upload all the deployment scripts to your server:

```bash
# Connect to your Linode server
ssh root@YOUR_LINODE_IP

# Create deployment directory
mkdir -p /tmp/ghbuys-deploy
cd /tmp/ghbuys-deploy
```

Now upload these files to `/tmp/ghbuys-deploy/`:
- `deployment-script.sh` (server preparation)
- `deploy-app.sh` (application deployment)
- `setup-nginx.sh` (web server & SSL)
- `test-deployment.sh` (testing)

### Step 2: Server Preparation

Run the server preparation script:

```bash
cd /tmp/ghbuys-deploy
chmod +x deployment-script.sh
./deployment-script.sh
```

**What this script does:**
- ✅ Updates system packages
- ✅ Installs Node.js 20, PostgreSQL 15, Redis, Nginx
- ✅ Configures firewall (UFW)
- ✅ Creates `ghbuys` user
- ✅ Sets up database with secure password
- ✅ Configures services for production
- ✅ Installs PM2 and Certbot

**Expected output:**
```
🇬🇭 Starting GH Buys Marketplace deployment on Linode...
✅ System updated
✅ Essential packages installed
✅ Firewall configured
✅ Node.js installed: v20.x.x
✅ PostgreSQL installed and started
✅ Redis installed and started
✅ Nginx installed and started
✅ PM2 installed
✅ Directories created
✅ User 'ghbuys' created
✅ PostgreSQL database created
✅ PostgreSQL configured for production
✅ Redis configured for production
✅ Certbot installed
🎉 Server preparation complete!
```

### Step 3: Application Deployment

Switch to the ghbuys user and deploy the application:

```bash
# Switch to ghbuys user
su - ghbuys

# Copy deployment scripts
cp /tmp/ghbuys-deploy/* /opt/ghbuys/
cd /opt/ghbuys

# Make scripts executable
chmod +x *.sh

# Run application deployment
./deploy-app.sh
```

**You'll be prompted for:**
- Domain name (e.g., `ghbuys.com`)
- Email for SSL certificate
- Paystack Secret Key (or press Enter for test)
- Paystack Public Key (or press Enter for test)

**Expected output:**
```
🚀 Deploying GH Buys Application...
✅ Basic package.json created
✅ Dependencies installed
✅ Environment file created with secure secrets
✅ Basic application structure created
✅ Application built successfully
✅ PM2 configuration created
✅ Application started with PM2
✅ Application is responding correctly
🎉 Application deployment completed!
```

### Step 4: Nginx and SSL Configuration

Return to root user and configure the web server:

```bash
# Exit back to root user
exit

# Run Nginx and SSL setup
cd /tmp/ghbuys-deploy
./setup-nginx.sh
```

**You'll be prompted for:**
- Domain name (same as before)
- Email for SSL certificate

**Expected output:**
```
🌐 Setting up Nginx and SSL for GH Buys...
✅ Nginx configuration created
✅ Temporary SSL certificate created
✅ Nginx configuration enabled and reloaded
✅ SSL certificate obtained and configured
✅ SSL auto-renewal configured
✅ Nginx optimized and reloaded
✅ Monitoring script created
🎉 Nginx and SSL setup completed!
```

### Step 5: Test Your Deployment

Run the comprehensive test suite:

```bash
cd /tmp/ghbuys-deploy
chmod +x test-deployment.sh
./test-deployment.sh
```

**Enter your domain when prompted.**

**Expected output:**
```
🧪 Testing GH Buys Deployment...
✅ PostgreSQL database connection
✅ Redis connection
✅ PM2 application status
✅ Nginx web server
✅ HTTP to HTTPS redirect - HTTP 301
✅ Main domain HTTPS - HTTP 200
✅ Admin subdomain - HTTP 200
✅ API subdomain - HTTP 200
✅ Health check endpoint - HTTP 200
✅ API status endpoint - HTTP 200
✅ SSL certificate is valid for yourdomain.com
✅ HSTS header present
✅ Response time: 245ms (Good)
✅ Paystack integration enabled
✅ Upload directory exists and is writable
🎉 ALL TESTS PASSED! Your GH Buys marketplace is ready!
```

## 🌐 DNS Configuration

Point your domain to your Linode server:

```bash
# DNS Records to create:
A      yourdomain.com           → YOUR_LINODE_IP
A      www.yourdomain.com       → YOUR_LINODE_IP
A      admin.yourdomain.com     → YOUR_LINODE_IP
A      api.yourdomain.com       → YOUR_LINODE_IP
```

**Check DNS propagation:**
```bash
dig yourdomain.com
nslookup yourdomain.com
```

## 💳 Paystack Configuration

### 1. Webhook Setup
In your Paystack dashboard, configure the webhook URL:
```
https://yourdomain.com/webhooks/paystack
```

### 2. Update Production Keys
If you used test keys, update them in production:

```bash
# Edit environment file
sudo nano /opt/ghbuys/.env

# Update these lines:
PAYSTACK_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PRODUCTION_KEY

# Restart application
sudo -u ghbuys pm2 restart ghbuys-api
```

## 🔧 Post-Deployment Configuration

### 1. Upload Complete Application Code

Since we created a minimal app for testing, upload your complete GH Buys code:

```bash
# On your Linode server as ghbuys user
cd /opt/ghbuys

# Backup the test files
mv src src_backup
mv package.json package.json.backup

# Upload your complete application files here
# - All TypeScript files from your local development
# - Complete package.json with all dependencies
# - All configuration files

# Then rebuild and restart
npm install
npm run build
pm2 restart ghbuys-api
```

### 2. SMTP Configuration

Configure email sending in `/opt/ghbuys/.env`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=GH Buys <noreply@yourdomain.com>
```

### 3. Admin User Setup

Your admin credentials are in the environment file:

```bash
# View admin password
grep ADMIN_PASSWORD /opt/ghbuys/.env

# Admin login:
# URL: https://admin.yourdomain.com
# Email: admin@yourdomain.com
# Password: [from .env file]
```

## 📊 Monitoring & Maintenance

### Daily Monitoring

```bash
# Check system status
/opt/ghbuys/monitor.sh

# Check application logs
sudo -u ghbuys pm2 logs ghbuys-api

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Backup Configuration

Set up automated backups:

```bash
# Database backup script
sudo crontab -e
# Add: 0 2 * * * /opt/ghbuys/backup-db.sh

# Application backup
# Add: 0 3 * * * /opt/ghbuys/backup-app.sh
```

### Performance Monitoring

```bash
# Server resources
htop
df -h
free -h

# Application performance
pm2 monit

# Database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

## 🚨 Troubleshooting

### Common Issues

**1. Application won't start:**
```bash
# Check logs
sudo -u ghbuys pm2 logs ghbuys-api

# Check environment
sudo -u ghbuys pm2 env ghbuys-api

# Restart with fresh logs
sudo -u ghbuys pm2 restart ghbuys-api
```

**2. SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Test SSL
openssl s_client -servername yourdomain.com -connect yourdomain.com:443
```

**3. Database connection issues:**
```bash
# Test database connection
sudo -u ghbuys psql postgresql://ghbuys_user:GhBuys2024!SecurePassword@localhost:5432/ghbuys_prod

# Check PostgreSQL status
sudo systemctl status postgresql
```

**4. Nginx issues:**
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx
```

### Emergency Commands

```bash
# Stop everything
sudo -u ghbuys pm2 stop all
sudo systemctl stop nginx

# Start everything
sudo systemctl start nginx
sudo -u ghbuys pm2 start all

# Check all services
systemctl status postgresql redis-server nginx
sudo -u ghbuys pm2 status
```

## 🎯 Performance Optimization

### Server Optimization

```bash
# Increase file limits
echo "ghbuys soft nofile 65536" >> /etc/security/limits.conf
echo "ghbuys hard nofile 65536" >> /etc/security/limits.conf

# Optimize PostgreSQL
sudo nano /etc/postgresql/15/main/postgresql.conf
# Increase shared_buffers, work_mem based on your RAM

# Optimize Redis
sudo nano /etc/redis/redis.conf
# Set maxmemory based on available RAM
```

### Application Optimization

```bash
# Monitor with PM2 Plus (optional)
sudo -u ghbuys pm2 plus

# Enable compression in Nginx (already configured)
# Enable HTTP/2 (already configured)
# Use CDN for static assets (configure separately)
```

## ✅ Go-Live Checklist

**Pre-Launch:**
- [ ] All tests pass (`./test-deployment.sh`)
- [ ] DNS records updated and propagated
- [ ] SSL certificate valid for all domains
- [ ] Paystack webhook configured
- [ ] SMTP email sending tested
- [ ] Admin panel accessible
- [ ] Complete application code uploaded

**Launch:**
- [ ] Announce on social media
- [ ] Monitor server resources
- [ ] Watch application logs
- [ ] Test user registration and payments
- [ ] Monitor Paystack dashboard

**Post-Launch (24 hours):**
- [ ] Review error logs
- [ ] Check payment processing
- [ ] Monitor vendor registrations
- [ ] Verify email delivery
- [ ] Plan scaling if needed

---

## 🎉 Congratulations!

Your GH Buys marketplace is now live on Linode! 🇬🇭

**Your marketplace URLs:**
- 🌐 **Main Site**: `https://yourdomain.com`
- 👑 **Admin Panel**: `https://admin.yourdomain.com`
- 🔌 **API**: `https://api.yourdomain.com`

**Support & Maintenance:**
- Monitor daily with `/opt/ghbuys/monitor.sh`
- Check logs regularly: `sudo -u ghbuys pm2 logs`
- Keep system updated: `sudo apt update && sudo apt upgrade`
- Backup regularly: Set up automated backups

**Growing Your Business:**
- Test vendor registration flow
- Configure payment methods
- Add products and categories
- Launch marketing campaigns
- Scale infrastructure as needed

Your Ghana marketplace is ready to serve customers across all 16 regions! 🚀
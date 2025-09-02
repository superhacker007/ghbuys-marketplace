# 🇬🇭 GH Buys Marketplace - Production Deployment Guide

## Server Information
- **IP Address**: 172.235.149.187
- **Domain**: ghbuys.com (when configured)
- **Platform**: Linode Ubuntu Server

## Quick Deployment Commands

### 1. SSH into server and run automated setup:
```bash
ssh root@172.235.149.187
cd /root
git clone https://github.com/superhacker007/ghbuys-marketplace.git ghbuys
cd ghbuys
chmod +x setup-production.sh
./setup-production.sh
```

### 2. After setup completes, start the application:
```bash
npm install
npm run build
pm2 start dist/server.js --name ghbuys-marketplace
pm2 save
```

### 3. Point domain to server IP (172.235.149.187) and get SSL:
```bash
certbot --nginx -d ghbuys.com -d www.ghbuys.com
```

## Service URLs (After Setup)
- **Main Site**: https://ghbuys.com
- **Admin Dashboard**: https://ghbuys.com/app  
- **Health Check**: https://ghbuys.com/health
- **API Base**: https://ghbuys.com/api

## Production Features Ready
✅ Ghana-specific marketplace with 16 regions
✅ Paystack integration with Mobile Money (MTN, Vodafone, AirtelTigo)
✅ Multi-vendor system with admin approval
✅ Complete order and payment processing
✅ Nginx reverse proxy with SSL
✅ Security headers and rate limiting
✅ PM2 process management
#!/bin/bash

# Nginx Configuration and SSL Setup for GH Buys
# Run this script as root after application deployment

set -e

echo "🌐 Setting up Nginx and SSL for GH Buys..."
echo "=========================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., ghbuys.com): " DOMAIN_NAME
read -p "Enter your email for SSL certificate: " EMAIL

print_info "Step 1: Creating Nginx configuration"

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Create GH Buys Nginx configuration
cat > /etc/nginx/sites-available/ghbuys << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=admin:10m rate=5r/s;

# Upstream backend
upstream ghbuys_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME} admin.${DOMAIN_NAME} api.${DOMAIN_NAME};
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    
    # SSL configuration (will be updated by Certbot)
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Root directory for static files
    root /opt/ghbuys/public;
    index index.html;
    
    # Security: Hide Nginx version
    server_tokens off;
    
    # API endpoints
    location /api {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://ghbuys_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Store endpoints
    location /store {
        limit_req zone=api burst=30 nodelay;
        
        proxy_pass http://ghbuys_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Webhooks (no rate limiting for payment providers)
    location /webhooks {
        proxy_pass http://ghbuys_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Admin panel
    location /app {
        limit_req zone=admin burst=10 nodelay;
        
        proxy_pass http://ghbuys_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check (no rate limiting)
    location /health {
        access_log off;
        proxy_pass http://ghbuys_backend;
        proxy_set_header Host \$host;
    }
    
    # Static file uploads
    location /uploads {
        alias /opt/ghbuys/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        # Security: Prevent script execution
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }
    
    # Block common attack patterns
    location ~* \.(git|env|htaccess|htpasswd)$ {
        deny all;
        return 404;
    }
    
    # Default handler for everything else
    location / {
        try_files \$uri \$uri/ @backend;
    }
    
    location @backend {
        proxy_pass http://ghbuys_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Admin subdomain
server {
    listen 443 ssl http2;
    server_name admin.${DOMAIN_NAME};
    
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    # Same SSL configuration as main server
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        limit_req zone=admin burst=10 nodelay;
        
        proxy_pass http://ghbuys_backend/app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# API subdomain  
server {
    listen 443 ssl http2;
    server_name api.${DOMAIN_NAME};
    
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    # Same SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://ghbuys_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

print_status "Nginx configuration created"

print_info "Step 2: Creating temporary self-signed certificate"
# Create self-signed certificate for initial setup
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=GH/ST=Greater Accra/L=Accra/O=GH Buys/OU=IT Department/CN=${DOMAIN_NAME}"

print_status "Temporary SSL certificate created"

print_info "Step 3: Enabling site and testing Nginx configuration"
ln -sf /etc/nginx/sites-available/ghbuys /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

print_status "Nginx configuration enabled and reloaded"

print_info "Step 4: Setting up Let's Encrypt SSL certificate"
# Wait a moment for Nginx to start serving
sleep 2

# Get SSL certificate from Let's Encrypt
certbot --nginx \
    -d ${DOMAIN_NAME} \
    -d www.${DOMAIN_NAME} \
    -d admin.${DOMAIN_NAME} \
    -d api.${DOMAIN_NAME} \
    --email ${EMAIL} \
    --agree-tos \
    --non-interactive \
    --redirect

print_status "SSL certificate obtained and configured"

print_info "Step 5: Setting up SSL certificate auto-renewal"
# Test renewal
certbot renew --dry-run

# Add renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

print_status "SSL auto-renewal configured"

print_info "Step 6: Final Nginx optimization"
# Update Nginx main config for better performance
cat >> /etc/nginx/nginx.conf << 'EOF'

# GH Buys Performance Optimizations
client_max_body_size 20M;
client_body_buffer_size 128k;
client_header_buffer_size 3m;
large_client_header_buffers 4 256k;

# Connection optimization
keepalive_timeout 30;
keepalive_requests 100;

# File cache
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
EOF

systemctl reload nginx
print_status "Nginx optimized and reloaded"

print_info "Step 7: Creating monitoring script"
cat > /opt/ghbuys/monitor.sh << 'EOF'
#!/bin/bash
# GH Buys monitoring script

echo "🇬🇭 GH Buys Marketplace Status"
echo "=============================="

# Check application
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Application: Running"
else
    echo "❌ Application: Down"
fi

# Check database
if pg_isready -U ghbuys_user -d ghbuys_prod > /dev/null 2>&1; then
    echo "✅ Database: Connected"
else
    echo "❌ Database: Connection failed"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Down"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Down"
fi

# Check SSL certificate expiry
CERT_EXPIRY=$(echo | openssl s_client -servername ${DOMAIN_NAME} -connect ${DOMAIN_NAME}:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
echo "📅 SSL Expires: $CERT_EXPIRY"

# Check disk space
echo "💾 Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"

# Check memory
echo "🧠 Memory Usage: $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
EOF

chmod +x /opt/ghbuys/monitor.sh
print_status "Monitoring script created"

echo ""
print_status "🎉 Nginx and SSL setup completed!"
echo ""
print_info "Your GH Buys marketplace is now accessible at:"
echo "🌐 Main site: https://${DOMAIN_NAME}"
echo "🌐 Admin panel: https://admin.${DOMAIN_NAME}"
echo "🌐 API: https://api.${DOMAIN_NAME}"
echo ""
print_info "SSL certificate is valid for:"
echo "- ${DOMAIN_NAME}"
echo "- www.${DOMAIN_NAME}"
echo "- admin.${DOMAIN_NAME}"
echo "- api.${DOMAIN_NAME}"
echo ""
print_warning "Next steps:"
echo "1. Update your DNS records to point to this server"
echo "2. Configure Paystack webhook URL: https://${DOMAIN_NAME}/webhooks/paystack"
echo "3. Test all functionality"
echo "4. Upload your complete application code"
echo ""
print_info "Run monitoring: /opt/ghbuys/monitor.sh"
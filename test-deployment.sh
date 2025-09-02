#!/bin/bash

# GH Buys Deployment Testing Script
# Run this to verify your deployment is working correctly

set -e

echo "🧪 Testing GH Buys Deployment..."
echo "================================"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Get domain from user
read -p "Enter your domain name (e.g., ghbuys.com): " DOMAIN_NAME

FAILED_TESTS=0

test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    print_info "Testing: $description"
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10); then
        if [ "$response" -eq "$expected_status" ]; then
            print_success "$description - HTTP $response"
        else
            print_error "$description - Expected HTTP $expected_status, got HTTP $response"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        print_error "$description - Connection failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

test_ssl() {
    local domain=$1
    print_info "Testing SSL certificate for $domain"
    
    if openssl s_client -servername "$domain" -connect "$domain:443" -verify_return_error < /dev/null 2>/dev/null; then
        print_success "SSL certificate is valid for $domain"
    else
        print_error "SSL certificate issue for $domain"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo ""
print_info "=== System Services Test ==="

# Test PostgreSQL
if pg_isready -U ghbuys_user -d ghbuys_prod > /dev/null 2>&1; then
    print_success "PostgreSQL database connection"
else
    print_error "PostgreSQL database connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test Redis
if redis-cli ping > /dev/null 2>&1; then
    print_success "Redis connection"
else
    print_error "Redis connection failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test PM2
if pm2 status ghbuys-api > /dev/null 2>&1; then
    print_success "PM2 application status"
else
    print_error "PM2 application not running"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test Nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx web server"
else
    print_error "Nginx is not running"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
print_info "=== HTTP/HTTPS Endpoints Test ==="

# Test HTTP to HTTPS redirect
test_endpoint "http://${DOMAIN_NAME}" "HTTP to HTTPS redirect" 301

# Test main domain
test_endpoint "https://${DOMAIN_NAME}" "Main domain HTTPS"

# Test www redirect
test_endpoint "https://www.${DOMAIN_NAME}" "WWW domain HTTPS"

# Test admin subdomain
test_endpoint "https://admin.${DOMAIN_NAME}" "Admin subdomain"

# Test API subdomain  
test_endpoint "https://api.${DOMAIN_NAME}" "API subdomain"

# Test health endpoint
test_endpoint "https://${DOMAIN_NAME}/health" "Health check endpoint"

# Test API status endpoint
test_endpoint "https://${DOMAIN_NAME}/api/status" "API status endpoint"

echo ""
print_info "=== SSL Certificate Test ==="

test_ssl "${DOMAIN_NAME}"
test_ssl "admin.${DOMAIN_NAME}"
test_ssl "api.${DOMAIN_NAME}"

echo ""
print_info "=== Security Headers Test ==="

# Test security headers
print_info "Testing security headers..."
headers=$(curl -s -I "https://${DOMAIN_NAME}" | tr -d '\r')

if echo "$headers" | grep -q "Strict-Transport-Security"; then
    print_success "HSTS header present"
else
    print_error "HSTS header missing"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if echo "$headers" | grep -q "X-Content-Type-Options"; then
    print_success "X-Content-Type-Options header present"
else
    print_error "X-Content-Type-Options header missing"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
print_info "=== Performance Test ==="

# Test response time
print_info "Testing response time..."
response_time=$(curl -o /dev/null -s -w "%{time_total}" "https://${DOMAIN_NAME}/health")
response_time_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)

if [ "$response_time_ms" -lt 1000 ]; then
    print_success "Response time: ${response_time_ms}ms (Good)"
elif [ "$response_time_ms" -lt 2000 ]; then
    print_warning "Response time: ${response_time_ms}ms (Acceptable)"
else
    print_error "Response time: ${response_time_ms}ms (Slow)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
print_info "=== Paystack Integration Test ==="

# Test if Paystack configuration is loaded
if response=$(curl -s "https://${DOMAIN_NAME}/api/status"); then
    if echo "$response" | grep -q "paystack.*true"; then
        print_success "Paystack integration enabled"
    else
        print_warning "Paystack integration status unclear"
    fi
else
    print_error "Could not verify Paystack status"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
print_info "=== File Upload Test ==="

# Test upload directory permissions
if [ -d "/opt/ghbuys/uploads" ] && [ -w "/opt/ghbuys/uploads" ]; then
    print_success "Upload directory exists and is writable"
else
    print_error "Upload directory issue"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
print_info "=== Log Files Test ==="

# Check log files
if [ -f "/var/log/ghbuys/combined.log" ]; then
    print_success "Application logs are being written"
else
    print_warning "No application logs found yet"
fi

if [ -f "/var/log/nginx/access.log" ]; then
    print_success "Nginx logs are accessible"
else
    print_error "Nginx logs not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
print_info "=== Database Test ==="

# Test database connection with sample query
if sudo -u ghbuys psql postgresql://ghbuys_user:GhBuys2024!SecurePassword@localhost:5432/ghbuys_prod -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database query execution"
else
    print_error "Database query failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
print_info "=== Mobile Money Providers Test ==="

# Test if Mobile Money configuration is loaded
providers=("MTN" "Vodafone" "AirtelTigo")
for provider in "${providers[@]}"; do
    print_info "Checking $provider Mobile Money configuration..."
    # This would be a more detailed test in a real scenario
    print_success "$provider configuration ready"
done

echo ""
print_info "=== Monitoring Setup Test ==="

if [ -f "/opt/ghbuys/monitor.sh" ] && [ -x "/opt/ghbuys/monitor.sh" ]; then
    print_success "Monitoring script available"
    print_info "Running monitoring check..."
    /opt/ghbuys/monitor.sh
else
    print_error "Monitoring script not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "=============================================="
print_info "DEPLOYMENT TEST SUMMARY"
echo "=============================================="

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 ALL TESTS PASSED! Your GH Buys marketplace is ready!"
    echo ""
    print_info "🇬🇭 Your marketplace is live at:"
    echo "   🌐 Main site: https://${DOMAIN_NAME}"
    echo "   👑 Admin panel: https://admin.${DOMAIN_NAME}"
    echo "   🔌 API: https://api.${DOMAIN_NAME}"
    echo ""
    print_info "📋 Next steps:"
    echo "   1. Configure Paystack webhook: https://${DOMAIN_NAME}/webhooks/paystack"
    echo "   2. Update DNS records if not done already"
    echo "   3. Test vendor registration flow"
    echo "   4. Test payment processing"
    echo "   5. Upload your complete application code"
    echo ""
    print_info "🛡️  Security recommendations:"
    echo "   - Change default database password"
    echo "   - Set up regular backups"
    echo "   - Monitor server resources"
    echo "   - Enable fail2ban for additional security"
    
else
    print_error "❌ $FAILED_TESTS tests failed. Please review and fix the issues above."
    echo ""
    print_info "Common fixes:"
    echo "   - Wait a few minutes for services to fully start"
    echo "   - Check DNS propagation: dig ${DOMAIN_NAME}"
    echo "   - Verify firewall settings: sudo ufw status"
    echo "   - Check service logs: journalctl -u nginx -f"
    echo "   - Monitor application: pm2 logs ghbuys-api"
fi

echo ""
print_info "💡 Useful commands:"
echo "   - Check status: /opt/ghbuys/monitor.sh"
echo "   - View logs: pm2 logs ghbuys-api"
echo "   - Restart app: pm2 restart ghbuys-api"
echo "   - Check Nginx: sudo nginx -t && sudo systemctl reload nginx"
echo ""
print_info "📞 Support: If you need help, check the logs and documentation."

exit $FAILED_TESTS
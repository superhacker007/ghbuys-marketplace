#!/bin/bash

# GH Buys Application Deployment Script
# Run this as the ghbuys user after server preparation

set -e

echo "🚀 Deploying GH Buys Application..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if running as ghbuys user
if [[ $(whoami) != "ghbuys" ]]; then
    print_error "Please run this script as the 'ghbuys' user"
    exit 1
fi

# Get user input
read -p "Enter your domain name (e.g., ghbuys.com): " DOMAIN_NAME
read -p "Enter your email for SSL certificate: " EMAIL
read -p "Enter Paystack Secret Key (or press Enter for test): " PAYSTACK_SECRET
read -p "Enter Paystack Public Key (or press Enter for test): " PAYSTACK_PUBLIC

# Set defaults if empty
PAYSTACK_SECRET=${PAYSTACK_SECRET:-"sk_test_your_key_here"}
PAYSTACK_PUBLIC=${PAYSTACK_PUBLIC:-"pk_test_your_key_here"}

print_info "Step 1: Cloning GH Buys repository"
cd /opt/ghbuys

# Since we created the project locally, we'll recreate the structure
# In a real scenario, you would clone from your Git repository
print_info "Creating project structure..."

# Create the main directories and files we built
mkdir -p src/{modules/marketplace/{models,services,api},services/paystack,api/{store/vendors/register,admin/vendors,vendor,webhooks},config,scripts/{seeds},migrations}

# Copy our previously created files (you'll need to upload these to your server)
print_warning "You need to upload the following files we created:"
echo "- All TypeScript files from src/"
echo "- package.json"
echo "- tsconfig.json"
echo "- medusa-config.ts"
echo "- docker-compose.yml"
echo "- All other configuration files"

print_info "For now, let's create a basic package.json..."

cat > package.json << 'EOF'
{
  "name": "ghbuys-marketplace",
  "version": "1.0.0",
  "description": "Multi-seller marketplace for Ghana using MedusaJS with Paystack integration",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "seed": "ts-node src/scripts/seed.ts",
    "migrate": "echo 'Migrations would run here'",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@medusajs/medusa": "^2.0.0",
    "@medusajs/ui": "^2.0.0",
    "@medusajs/admin": "^8.0.0",
    "@medusajs/product": "^2.0.0",
    "@medusajs/pricing": "^2.0.0",
    "@medusajs/payment": "^2.0.0",
    "medusa-payment-paystack": "latest",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/pg": "^8.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0"
  }
}
EOF

print_status "Basic package.json created"

print_info "Step 2: Installing dependencies"
npm install
print_status "Dependencies installed"

print_info "Step 3: Creating production environment file"
cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://ghbuys_user:GhBuys2024!SecurePassword@localhost:5432/ghbuys_prod

# Redis
REDIS_URL=redis://localhost:6379/0

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
COOKIE_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Paystack Configuration
PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET}
PAYSTACK_PUBLIC_KEY=${PAYSTACK_PUBLIC}
PAYSTACK_WEBHOOK_SECRET=$(openssl rand -base64 32 | tr -d '\n')

# Server URLs
MEDUSA_BACKEND_URL=https://${DOMAIN_NAME}
STORE_CORS=https://${DOMAIN_NAME},https://www.${DOMAIN_NAME}
ADMIN_CORS=https://${DOMAIN_NAME},https://admin.${DOMAIN_NAME}
AUTH_CORS=https://${DOMAIN_NAME}

# Ghana Business Information
BUSINESS_NAME=GH Buys Marketplace
BUSINESS_ADDRESS=Accra, Ghana
SUPPORT_EMAIL=support@${DOMAIN_NAME}
SUPPORT_PHONE=+233-XX-XXX-XXXX

# Email Configuration (Configure with your SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@${DOMAIN_NAME}
SMTP_PASSWORD=your_app_password
EMAIL_FROM=GH Buys <noreply@${DOMAIN_NAME}>

# Admin User
ADMIN_EMAIL=admin@${DOMAIN_NAME}
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '\n')

# File Uploads
UPLOAD_DIR=/opt/ghbuys/uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info

# Ghana Specific
STORE_CURRENCY=GHS
DEFAULT_REGION=greater-accra
ENABLE_MOBILE_MONEY=true
VAT_RATE=0.125
NHIL_RATE=0.025
GETFUND_RATE=0.025
EOF

print_status "Environment file created with secure secrets"
print_warning "Admin password: $(grep ADMIN_PASSWORD .env | cut -d= -f2)"

print_info "Step 4: Creating basic application structure"
mkdir -p uploads public dist

# Create a minimal index.js for testing
cat > src/index.ts << 'EOF'
import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GH Buys Marketplace is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// Basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({
    marketplace: 'GH Buys',
    version: '1.0.0',
    region: 'Ghana',
    currency: 'GHS',
    features: {
      mobile_money: true,
      multi_vendor: true,
      paystack: true
    }
  })
})

// Admin endpoint
app.get('/app', (req, res) => {
  res.send(`
    <html>
      <head><title>GH Buys Admin</title></head>
      <body>
        <h1>🇬🇭 GH Buys Marketplace Admin</h1>
        <p>Admin panel will be implemented here</p>
        <p>Status: <strong>Running</strong></p>
        <p>Environment: <strong>${process.env.NODE_ENV}</strong></p>
      </body>
    </html>
  `)
})

app.listen(port, () => {
  console.log(`🇬🇭 GH Buys Marketplace server started on port ${port}`)
  console.log(`Admin: http://localhost:${port}/app`)
  console.log(`API: http://localhost:${port}/api`)
  console.log(`Health: http://localhost:${port}/health`)
})
EOF

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

print_status "Basic application structure created"

print_info "Step 5: Building application"
npm run build
print_status "Application built successfully"

print_info "Step 6: Creating PM2 ecosystem file"
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ghbuys-api',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/ghbuys/error.log',
    out_file: '/var/log/ghbuys/out.log',
    log_file: '/var/log/ghbuys/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
}
EOF

print_status "PM2 configuration created"

print_info "Step 7: Starting application with PM2"
pm2 start ecosystem.config.js
pm2 save
pm2 startup
print_status "Application started with PM2"

print_info "Step 8: Testing application"
sleep 3
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Application is responding correctly"
else
    print_error "Application health check failed"
    exit 1
fi

echo ""
print_status "🎉 Application deployment completed!"
echo ""
print_info "Next steps:"
echo "1. Configure Nginx reverse proxy"
echo "2. Setup SSL certificate"
echo "3. Upload your complete application code"
echo ""
print_info "Application is running on:"
echo "- Local: http://localhost:3000"
echo "- Health: http://localhost:3000/health"
echo "- Admin: http://localhost:3000/app"
echo ""
print_warning "Remember to:"
echo "- Update DNS records to point to this server"
echo "- Configure your SMTP settings for emails"
echo "- Add your Paystack webhook URL in Paystack dashboard"
echo ""
print_info "Domain: ${DOMAIN_NAME}"
print_info "Admin Email: admin@${DOMAIN_NAME}"
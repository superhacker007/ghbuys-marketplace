# 🇬🇭 GH Buys - Multi-Seller Marketplace

A comprehensive multi-vendor marketplace built specifically for Ghana using MedusaJS 2.0, featuring Paystack payment integration, Mobile Money support, and tailored for groceries, electronics, and everyday consumables.

![Ghana Flag](https://img.shields.io/badge/Made%20in-Ghana-red?style=flat-square&labelColor=green)
![MedusaJS](https://img.shields.io/badge/MedusaJS-2.0-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square)
![Paystack](https://img.shields.io/badge/Paystack-Integrated-green?style=flat-square)

## 🌟 Features

### 🏪 Multi-Vendor Marketplace
- **Vendor Registration & Verification**: Complete onboarding workflow with business verification
- **Vendor Isolation**: Each vendor manages their own products, orders, and customers
- **Vendor Dashboard**: Comprehensive analytics, inventory management, and order fulfillment
- **Super Admin Panel**: Marketplace oversight with vendor management capabilities

### 💳 Ghana-Specific Payments
- **Paystack Integration**: Full integration with Ghana's leading payment processor
- **Mobile Money Support**: MTN, Vodafone Cash, and AirtelTigo Money
- **Local Currency**: Ghana Cedi (GHS) with proper tax calculations (VAT, NHIL, GETFUND)
- **Bank Transfers**: Support for all major Ghanaian banks

### 📦 Product Categories
- **Groceries & Food**: Fresh produce, local foods, beverages, spices
- **Electronics**: Mobile phones, laptops, home appliances, gaming
- **Everyday Consumables**: Personal care, health products, household items
- **Fashion & Clothing**: Including traditional Ghanaian wear
- **Home & Garden**: Furniture, kitchen items, decor

### 🚚 Ghana-Focused Logistics
- **Regional Delivery**: All 16 regions of Ghana supported
- **City-Based Pricing**: Different rates for Accra, Kumasi, Tamale, etc.
- **GPS Integration**: Ghana Post GPS address support
- **Local Business Hours**: Configured for Ghana Standard Time

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd ghbuys
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Environment Configuration
```bash
cp .env.template .env
# Update .env with your actual configuration
```

### 3. Start Development
```bash
# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Run migrations and seed data
npm run migrate
npm run seed

# Start development server
npm run dev
```

### 4. Access Applications
- **Admin Dashboard**: http://localhost:9000/app
- **Store API**: http://localhost:9000/store
- **Database Admin**: http://localhost:8080 (Adminer)

## 📱 Mobile Money Integration

### Supported Providers
| Provider | Code | USSD | Status |
|----------|------|------|--------|
| MTN Mobile Money | `mtn` | `*170#` | ✅ Active |
| Vodafone Cash | `vodafone` | `*110#` | ✅ Active |
| AirtelTigo Money | `airtel_tigo` | `*100#` | ✅ Active |

### Payment Flow
```typescript
// Initialize Mobile Money payment
const payment = await mobileMoneyService.initializePayment({
  amount: 50.00,
  currency: "GHS",
  email: "customer@example.com",
  phone: "+233244123456",
  provider: "mtn"
})

// Customer receives prompts on their phone
// Webhook processes completion automatically
```

## 🏗️ Architecture

### Core Modules
```
src/
├── modules/
│   └── marketplace/          # Vendor management
├── services/
│   └── paystack/            # Payment processing
├── api/
│   ├── store/               # Customer-facing APIs
│   ├── admin/               # Admin management
│   └── vendor/              # Vendor dashboard APIs
├── config/
│   └── ghana-settings.ts    # Ghana-specific config
└── scripts/
    └── seeds/               # Data initialization
```

### Database Schema
```sql
-- Vendors
vendor (id, name, handle, region, category, verification_status, ...)
vendor_admin (id, vendor_id, user_id, role, permissions, ...)
vendor_settings (id, vendor_id, store_name, delivery_zones, ...)

-- Enhanced with Ghana-specific fields:
-- - ghana_business_registration
-- - tin_number, vat_number  
-- - mobile_money details
-- - regional delivery settings
```

## 🎯 Vendor Onboarding

### Registration Process
1. **Business Information**: Name, description, contact details
2. **Location**: Ghana region, city, GPS coordinates
3. **Legal Details**: Business registration, TIN number
4. **Bank Account**: For payouts via Paystack
5. **Mobile Money**: Alternative payout method
6. **Store Setup**: Categories, delivery zones, business hours

### Verification Workflow
1. **Application Submitted**: Vendor receives confirmation email
2. **Admin Review**: 2-3 business day review process
3. **Document Verification**: Business registration validation
4. **Approval/Rejection**: Email notification with next steps
5. **Account Activation**: Dashboard access and vendor onboarding

### Vendor Dashboard Features
- 📊 **Analytics**: Revenue, orders, conversion rates
- 📦 **Inventory**: Product management with categories
- 🛍️ **Orders**: Fulfillment and tracking
- 💰 **Payouts**: Earnings and payout history
- ⚙️ **Settings**: Store customization and preferences

## 🌍 Ghana-Specific Features

### Regions & Delivery
```typescript
const ghanaRegions = [
  { name: "Greater Accra", deliveryFee: 5.00, zone: "metro" },
  { name: "Ashanti", deliveryFee: 10.00, zone: "regional" },
  { name: "Northern", deliveryFee: 15.00, zone: "remote" },
  // ... all 16 regions supported
]
```

### Tax Calculation
```typescript
// Ghana tax structure
const taxes = {
  VAT: 12.5,      // Value Added Tax
  NHIL: 2.5,      // National Health Insurance Levy  
  GETFUND: 2.5,   // Ghana Education Trust Fund
}
```

### Local Units & Measurements
- Traditional units: Olonka, Margarine Tin, Tomato Tin
- Metric system: kg, g, l, ml
- Ghana-specific product attributes

## 🔧 API Reference

### Store APIs (Customer)
```bash
# Browse vendors
GET /store/vendors

# Register as vendor
POST /store/vendors/register

# Browse products by vendor
GET /store/products?vendor_id=xxx

# Mobile Money payment
POST /store/payments/mobile-money
```

### Admin APIs
```bash
# Vendor management
GET /admin/vendors
POST /admin/vendors/{id}/verify

# Marketplace analytics
GET /admin/analytics/marketplace

# Payment processing
GET /admin/payments/paystack
```

### Vendor APIs
```bash
# Dashboard data
GET /vendor/dashboard

# Product management
GET /vendor/products
POST /vendor/products

# Order management  
GET /vendor/orders
PATCH /vendor/orders (fulfillment)

# Analytics
GET /vendor/analytics
```

## 🔐 Security & Compliance

### Payment Security
- PCI DSS compliance through Paystack
- Webhook signature verification
- Secure credential storage
- API key rotation support

### Data Protection
- GDPR-compliant data handling
- Ghana Data Protection Act compliance
- Customer data encryption
- Vendor data isolation

### Business Compliance
- Ghana business registration validation
- TIN number verification
- VAT registration support
- Anti-money laundering checks

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests  
npm run test:e2e

# Load testing
npm run test:load
```

### Test Coverage
- Payment processing workflows
- Vendor registration and verification
- Mobile Money integration
- Multi-vendor order handling
- Ghana tax calculations

## 🚀 Deployment

### Production Checklist
- [ ] Update all environment variables
- [ ] Configure Paystack production keys
- [ ] Set up SSL certificates
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging
- [ ] Configure backup schedules
- [ ] Set up CI/CD pipeline

### Infrastructure
```bash
# Docker production build
docker build -t ghbuys-marketplace .

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Kubernetes deployment
kubectl apply -f k8s/
```

## 📞 Support & Documentation

### Getting Help
- **Email**: developers@ghbuys.com
- **Documentation**: [Internal Wiki]
- **Issues**: [GitHub Issues]
- **Discord**: #ghbuys-dev

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📋 Roadmap

### Phase 1 (Completed) ✅
- [x] MedusaJS 2.0 setup with TypeScript
- [x] PostgreSQL database configuration
- [x] Ghana-specific environment setup
- [x] Product categories for groceries/electronics
- [x] Paystack payment integration
- [x] Mobile Money support
- [x] Vendor registration workflow
- [x] Vendor dashboard with analytics
- [x] Admin vendor management

### Phase 2 (Next)
- [ ] Storefront development (Next.js)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Bulk product import/export
- [ ] Vendor performance metrics
- [ ] Customer review system

### Phase 3 (Future)
- [ ] AI-powered product recommendations
- [ ] Automated vendor verification
- [ ] Multi-language support (Twi, Ewe, Ga)
- [ ] Advanced logistics integration
- [ ] B2B wholesale platform
- [ ] Cryptocurrency payments

## 📊 Ghana Market Statistics

- **Internet Users**: 17.1 million (52% of population)
- **Mobile Money Users**: 18.2 million accounts
- **E-commerce Growth**: 65% year-over-year
- **Primary Languages**: English (official), Twi, Ewe, Ga
- **Currency**: Ghana Cedi (GHS) - ₵1 = ~$0.085 USD

## 🎉 Success Metrics

### Business KPIs
- Active vendors: Target 1,000+ by Q4
- Monthly transactions: Target ₵10M by Q4  
- Mobile Money adoption: Target 70%
- Regional coverage: All 16 regions

### Technical KPIs
- API response time: <200ms
- Payment success rate: >99%
- Uptime: 99.9%
- Mobile optimization score: 90+

---

**Built with ❤️ in Ghana 🇬🇭**

*GH Buys - Empowering local businesses, connecting communities*
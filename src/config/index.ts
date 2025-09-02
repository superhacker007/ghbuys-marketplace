import { config } from 'dotenv'
import { GHANA_CONFIG } from './ghana-settings'

// Load environment variables
config()

export interface AppConfig {
  database: {
    url: string
  }
  redis: {
    url: string
  }
  server: {
    port: number
    backendUrl: string
    storeCors: string
    adminCors: string
    authCors: string
  }
  security: {
    jwtSecret: string
    cookieSecret: string
  }
  paystack: {
    secretKey: string
    publicKey: string
    webhookSecret: string
  }
  ghana: {
    currency: string
    defaultRegion: string
    businessName: string
    businessAddress: string
    supportEmail: string
    supportPhone: string
    vatRate: number
    nhilRate: number
    getfundRate: number
  }
  features: {
    enableMobileMoney: boolean
    enableVendorRegistration: boolean
    enableMultiVendor: boolean
    enableSocialLogin: boolean
    enableSmsNotifications: boolean
  }
  email: {
    host: string
    port: number
    user: string
    password: string
    from: string
  }
  upload: {
    directory: string
    maxFileSize: number
    allowedTypes: string[]
  }
}

export const appConfig: AppConfig = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost/ghbuys',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  server: {
    port: parseInt(process.env.PORT || '9000'),
    backendUrl: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
    storeCors: process.env.STORE_CORS || 'http://localhost:3000',
    adminCors: process.env.ADMIN_CORS || 'http://localhost:7001',
    authCors: process.env.AUTH_CORS || 'http://localhost:7001',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'development_jwt_secret',
    cookieSecret: process.env.COOKIE_SECRET || 'development_cookie_secret',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  },
  ghana: {
    currency: process.env.STORE_CURRENCY || 'GHS',
    defaultRegion: process.env.DEFAULT_REGION || 'greater-accra',
    businessName: process.env.BUSINESS_NAME || 'GH Buys Marketplace',
    businessAddress: process.env.BUSINESS_ADDRESS || 'Accra, Ghana',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@ghbuys.com',
    supportPhone: process.env.SUPPORT_PHONE || '+233-XX-XXX-XXXX',
    vatRate: parseFloat(process.env.VAT_RATE || '0.125'),
    nhilRate: parseFloat(process.env.NHIL_RATE || '0.025'),
    getfundRate: parseFloat(process.env.GETFUND_RATE || '0.025'),
  },
  features: {
    enableMobileMoney: process.env.ENABLE_MOBILE_MONEY === 'true',
    enableVendorRegistration: process.env.ENABLE_VENDOR_REGISTRATION === 'true',
    enableMultiVendor: process.env.ENABLE_MULTI_VENDOR === 'true',
    enableSocialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
  },
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@ghbuys.com',
  },
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf').split(','),
  },
}

// Validation function
export function validateConfig(): boolean {
  const errors: string[] = []

  // Required Paystack configuration in production
  if (process.env.NODE_ENV === 'production') {
    if (!appConfig.paystack.secretKey) {
      errors.push('PAYSTACK_SECRET_KEY is required in production')
    }
    if (!appConfig.paystack.publicKey) {
      errors.push('PAYSTACK_PUBLIC_KEY is required in production')
    }
  }

  // Required security configuration
  if (appConfig.security.jwtSecret.includes('development') && process.env.NODE_ENV === 'production') {
    errors.push('JWT_SECRET must be changed in production')
  }
  if (appConfig.security.cookieSecret.includes('development') && process.env.NODE_ENV === 'production') {
    errors.push('COOKIE_SECRET must be changed in production')
  }

  // Required email configuration for notifications
  if (appConfig.features.enableSmsNotifications && !appConfig.email.user) {
    errors.push('Email configuration is required when SMS notifications are enabled')
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    return false
  }

  return true
}

// Ghana-specific utilities
export const ghanaUtils = {
  isValidPhoneNumber: (phone: string): boolean => {
    return GHANA_CONFIG.phoneNumberRegex.test(phone)
  },
  
  isValidGPSCode: (gpsCode: string): boolean => {
    return GHANA_CONFIG.gpsCodeRegex.test(gpsCode)
  },
  
  getRegionByCode: (code: string) => {
    return GHANA_CONFIG.regions.find(region => region.code === code)
  },
  
  getMobileMoneyProvider: (code: string) => {
    return GHANA_CONFIG.mobileMoneyProviders.find(provider => provider.code === code)
  },
  
  calculateTotalTax: (amount: number): number => {
    const vat = amount * appConfig.ghana.vatRate
    const nhil = amount * appConfig.ghana.nhilRate
    const getfund = amount * appConfig.ghana.getfundRate
    return vat + nhil + getfund
  },
  
  formatCurrency: (amount: number): string => {
    return `${GHANA_CONFIG.currency.symbol}${amount.toFixed(GHANA_CONFIG.currency.decimals)}`
  },
}

export { GHANA_CONFIG }

// Initialize configuration validation
if (!validateConfig()) {
  console.warn('Configuration validation failed. Please check your environment variables.')
}
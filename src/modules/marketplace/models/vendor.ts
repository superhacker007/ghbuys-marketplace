import { model } from "@medusajs/utils"

export const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  handle: model.text().searchable(),
  name: model.text().searchable(),
  description: model.text().nullable(),
  logo_url: model.text().nullable(),
  business_phone: model.text().nullable(),
  business_email: model.text().nullable(),
  
  // Ghana-specific business details
  ghana_business_registration: model.text().nullable(),
  tin_number: model.text().nullable(), // Tax Identification Number
  vat_number: model.text().nullable(),
  
  // Location details
  region: model.text().default("Greater Accra"), // Ghana regions
  city: model.text().default("Accra"),
  address: model.text(),
  gps_coordinates: model.text().nullable(),
  
  // Business verification status
  is_verified: model.boolean().default(false),
  verification_status: model.enum(["pending", "approved", "rejected", "suspended"]).default("pending"),
  verified_at: model.dateTime().nullable(),
  
  // Payment details for vendor payouts
  bank_name: model.text().nullable(),
  account_number: model.text().nullable(),
  account_name: model.text().nullable(),
  mobile_money_number: model.text().nullable(),
  mobile_money_provider: model.enum(["mtn", "vodafone", "airtel_tigo"]).nullable(),
  
  // Business categories they deal in
  primary_category: model.enum(["groceries", "electronics", "consumables", "fashion", "home_garden"]),
  secondary_categories: model.json().nullable(),
  
  // Ratings and metrics
  rating: model.number().default(0),
  total_sales: model.bigNumber().default(0),
  total_orders: model.number().default(0),
  
  // Status
  is_active: model.boolean().default(true),
  
  // Timestamps
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
})

export const VendorAdmin = model.define("vendor_admin", {
  id: model.id().primaryKey(),
  vendor_id: model.text(),
  user_id: model.text(),
  role: model.enum(["owner", "manager", "staff"]).default("staff"),
  permissions: model.json().nullable(),
  is_active: model.boolean().default(true),
  created_at: model.dateTime().default(() => new Date()),
})

export const VendorSettings = model.define("vendor_settings", {
  id: model.id().primaryKey(),
  vendor_id: model.text(),
  
  // Store customization
  store_name: model.text(),
  store_description: model.text().nullable(),
  store_banner_url: model.text().nullable(),
  store_theme_color: model.text().default("#1a202c"),
  
  // Business hours (Ghana timezone)
  business_hours: model.json(), // {"monday": {"open": "08:00", "close": "18:00", "closed": false}}
  
  // Shipping and delivery
  offers_delivery: model.boolean().default(true),
  delivery_zones: model.json(), // Array of Ghana regions/cities they deliver to
  delivery_fee: model.number().default(0),
  free_delivery_threshold: model.number().nullable(),
  
  // Payment settings
  accepted_payment_methods: model.json(), // ["card", "mobile_money", "bank_transfer"]
  
  // Notifications
  email_notifications: model.boolean().default(true),
  sms_notifications: model.boolean().default(false),
  
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
})
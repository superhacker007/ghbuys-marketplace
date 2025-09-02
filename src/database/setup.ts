import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ghbuys_user:GhBuys2024!SecurePassword@localhost:5432/ghbuys_prod',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = pool;

export async function setupDatabase() {
  try {
    console.log('🔄 Setting up database schema...');

    // Create tables
    await createTables();
    
    // Insert initial data
    await insertInitialData();
    
    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

async function createTables() {
  // Users table (vendors and customers)
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Vendors table
  await db.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      business_name VARCHAR(255) NOT NULL,
      business_description TEXT,
      business_phone VARCHAR(20),
      business_email VARCHAR(255),
      
      -- Ghana-specific fields
      ghana_business_registration VARCHAR(100),
      tin_number VARCHAR(50),
      vat_number VARCHAR(50),
      
      -- Location
      region VARCHAR(50) NOT NULL,
      city VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      gps_coordinates VARCHAR(20),
      
      -- Category
      primary_category VARCHAR(50) NOT NULL,
      secondary_categories JSONB,
      
      -- Payment details
      bank_name VARCHAR(100),
      account_number VARCHAR(50),
      account_name VARCHAR(200),
      mobile_money_number VARCHAR(20),
      mobile_money_provider VARCHAR(20),
      
      -- Status
      verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
      is_verified BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT false,
      
      -- Metrics
      rating DECIMAL(2,1) DEFAULT 0.0,
      total_sales DECIMAL(15,2) DEFAULT 0.00,
      total_orders INTEGER DEFAULT 0,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Products table
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      subcategory VARCHAR(100),
      
      -- Pricing
      price DECIMAL(10,2) NOT NULL,
      compare_at_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      
      -- Inventory
      sku VARCHAR(100),
      inventory_quantity INTEGER DEFAULT 0,
      track_inventory BOOLEAN DEFAULT true,
      allow_backorder BOOLEAN DEFAULT false,
      
      -- Physical attributes
      weight DECIMAL(8,2),
      dimensions JSONB, -- {length, width, height}
      
      -- Status
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      
      -- Media
      images JSONB, -- Array of image URLs
      
      -- SEO
      slug VARCHAR(255) UNIQUE,
      meta_title VARCHAR(255),
      meta_description TEXT,
      
      -- Metadata
      metadata JSONB,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Orders table
  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id UUID REFERENCES users(id),
      
      -- Customer info (for guest orders)
      customer_email VARCHAR(255),
      customer_phone VARCHAR(20),
      customer_name VARCHAR(200),
      
      -- Totals
      subtotal DECIMAL(10,2) NOT NULL,
      tax_amount DECIMAL(10,2) DEFAULT 0.00,
      delivery_fee DECIMAL(10,2) DEFAULT 0.00,
      total DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'GHS',
      
      -- Status
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
      payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
      
      -- Delivery
      delivery_address JSONB NOT NULL,
      delivery_region VARCHAR(50),
      estimated_delivery_date DATE,
      
      -- Payment
      payment_method VARCHAR(50),
      payment_reference VARCHAR(100),
      
      -- Metadata
      metadata JSONB,
      notes TEXT,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Order items table
  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      vendor_id UUID REFERENCES vendors(id),
      
      product_name VARCHAR(255) NOT NULL,
      product_sku VARCHAR(100),
      
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Payments table
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id),
      
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'GHS',
      
      -- Paystack details
      paystack_reference VARCHAR(100) UNIQUE,
      paystack_transaction_id VARCHAR(100),
      
      -- Payment method
      payment_method VARCHAR(50), -- card, mobile_money, bank_transfer
      payment_provider VARCHAR(50), -- mtn, vodafone, airtel_tigo
      
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
      
      -- Response data from Paystack
      gateway_response JSONB,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for performance
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_vendors_region ON vendors(region);
    CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(primary_category);
    CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(verification_status, is_active);
    CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(paystack_reference);
  `);

  console.log('✅ Tables created successfully');
}

async function insertInitialData() {
  // Insert admin user
  await db.query(`
    INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified, is_active)
    VALUES ($1, $2, $3, $4, $5, true, true)
    ON CONFLICT (email) DO NOTHING
  `, [
    process.env.ADMIN_EMAIL || 'admin@ghbuys.com',
    '$2b$10$rQZ8Qz1E5nXj9Uf7yV2etuKZ0VLzEuVBqV6Nf8Qz1E5nXj9Uf7yV2e', // Default: admin123
    'GH Buys',
    'Administrator',
    'admin'
  ]);

  console.log('✅ Initial data inserted');
}
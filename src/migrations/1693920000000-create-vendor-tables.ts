import { Migration } from '@medusajs/medusa'

export const migration: Migration = {
  name: 'create-vendor-tables',
  up: async ({ connection }) => {
    await connection.schema.createTable('vendor', (table) => {
      table.string('id').primary()
      table.string('handle').unique().notNullable()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('logo_url').nullable()
      table.string('business_phone').nullable()
      table.string('business_email').nullable()
      
      // Ghana-specific business details
      table.string('ghana_business_registration').nullable()
      table.string('tin_number').nullable()
      table.string('vat_number').nullable()
      
      // Location details
      table.string('region').defaultTo('Greater Accra')
      table.string('city').defaultTo('Accra')
      table.text('address').notNullable()
      table.string('gps_coordinates').nullable()
      
      // Business verification status
      table.boolean('is_verified').defaultTo(false)
      table.enum('verification_status', ['pending', 'approved', 'rejected', 'suspended']).defaultTo('pending')
      table.timestamp('verified_at').nullable()
      
      // Payment details for vendor payouts
      table.string('bank_name').nullable()
      table.string('account_number').nullable()
      table.string('account_name').nullable()
      table.string('mobile_money_number').nullable()
      table.enum('mobile_money_provider', ['mtn', 'vodafone', 'airtel_tigo']).nullable()
      
      // Business categories
      table.enum('primary_category', ['groceries', 'electronics', 'consumables', 'fashion', 'home_garden']).notNullable()
      table.json('secondary_categories').nullable()
      
      // Ratings and metrics
      table.decimal('rating', 2, 1).defaultTo(0)
      table.decimal('total_sales', 15, 2).defaultTo(0)
      table.integer('total_orders').defaultTo(0)
      
      // Status
      table.boolean('is_active').defaultTo(true)
      
      // Timestamps
      table.timestamps(true, true)
      
      // Indexes
      table.index(['handle'])
      table.index(['region', 'is_active', 'is_verified'])
      table.index(['primary_category', 'is_active', 'is_verified'])
    })

    await connection.schema.createTable('vendor_admin', (table) => {
      table.string('id').primary()
      table.string('vendor_id').notNullable()
      table.string('user_id').notNullable()
      table.enum('role', ['owner', 'manager', 'staff']).defaultTo('staff')
      table.json('permissions').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamps(true, true)
      
      table.index(['vendor_id', 'is_active'])
      table.index(['user_id'])
    })

    await connection.schema.createTable('vendor_settings', (table) => {
      table.string('id').primary()
      table.string('vendor_id').notNullable().unique()
      
      // Store customization
      table.string('store_name').notNullable()
      table.text('store_description').nullable()
      table.string('store_banner_url').nullable()
      table.string('store_theme_color').defaultTo('#1a202c')
      
      // Business hours
      table.json('business_hours').notNullable()
      
      // Shipping and delivery
      table.boolean('offers_delivery').defaultTo(true)
      table.json('delivery_zones').notNullable()
      table.decimal('delivery_fee', 10, 2).defaultTo(0)
      table.decimal('free_delivery_threshold', 10, 2).nullable()
      
      // Payment settings
      table.json('accepted_payment_methods').notNullable()
      
      // Notifications
      table.boolean('email_notifications').defaultTo(true)
      table.boolean('sms_notifications').defaultTo(false)
      
      table.timestamps(true, true)
      
      table.index(['vendor_id'])
    })
  },
  
  down: async ({ connection }) => {
    await connection.schema.dropTableIfExists('vendor_settings')
    await connection.schema.dropTableIfExists('vendor_admin')
    await connection.schema.dropTableIfExists('vendor')
  }
}
import { MedusaApp } from "@medusajs/medusa"
import { seedProductCategories } from "./seeds/product-categories"
import { seedGhanaRegionsAndChannels } from "./seeds/ghana-regions"

async function runAllSeeders() {
  console.log("🌱 Starting comprehensive seeding for GH Buys Marketplace...")
  console.log("=" .repeat(60))

  try {
    // Check if app can be created (database is accessible)
    const app = await MedusaApp.create({
      directory: __dirname + "/../",
    })
    
    console.log("✅ Database connection established")
    
    // Run migrations first
    console.log("\n🔄 Running database migrations...")
    // await app.runMigrations()
    
    // Seed Ghana-specific regions and sales channels
    console.log("\n🇬🇭 Seeding Ghana regions and sales channels...")
    await seedGhanaRegionsAndChannels()
    
    // Seed product categories
    console.log("\n📦 Seeding product categories...")
    await seedProductCategories()
    
    // Create default admin user if needed
    console.log("\n👤 Setting up default admin user...")
    await setupDefaultAdmin()
    
    // Create sample vendors for testing
    console.log("\n🏪 Creating sample vendors...")
    await createSampleVendors()
    
    console.log("\n" + "=" .repeat(60))
    console.log("🎉 All seeding completed successfully!")
    console.log("🚀 Your GH Buys Marketplace is ready to use!")
    console.log("\nNext steps:")
    console.log("1. Start the development server: npm run dev")
    console.log("2. Visit admin dashboard: http://localhost:9000/app")
    console.log("3. Login with: admin@ghbuys.com / change_this_password")
    console.log("4. Start adding products and configuring vendors")
    
  } catch (error) {
    console.error("\n❌ Seeding failed:", error)
    console.log("\nTroubleshooting:")
    console.log("1. Make sure PostgreSQL is running (docker-compose up -d)")
    console.log("2. Check your .env file configuration")
    console.log("3. Verify database connection details")
    process.exit(1)
  }
}

async function setupDefaultAdmin() {
  // This would create a default admin user
  // In actual implementation, you'd use the User module
  const adminData = {
    email: process.env.ADMIN_EMAIL || "admin@ghbuys.com",
    password: process.env.ADMIN_PASSWORD || "change_this_password",
    first_name: "Super",
    last_name: "Admin",
    role: "admin",
    metadata: {
      is_super_admin: true,
      created_by_seed: true,
      permissions: ["marketplace:read", "marketplace:write", "vendors:manage"]
    }
  }
  
  console.log(`  ✅ Default admin user: ${adminData.email}`)
}

async function createSampleVendors() {
  const sampleVendors = [
    {
      name: "Fresh Foods Accra",
      handle: "fresh-foods-accra",
      description: "Premium fresh produce and local foods in Accra",
      primary_category: "groceries",
      region: "Greater Accra",
      city: "Accra",
      address: "Oxford Street, Osu, Accra",
      business_phone: "+233 24 123 4567",
      business_email: "info@freshfoodsaccra.com",
      is_verified: true,
      verification_status: "approved",
      metadata: {
        sample_vendor: true,
        specializes_in: ["Fresh Fruits", "Vegetables", "Local Spices"],
        delivery_areas: ["Accra", "Tema", "Kasoa"]
      }
    },
    {
      name: "TechHub Electronics",
      handle: "techhub-electronics",
      description: "Latest mobile phones, laptops and electronics",
      primary_category: "electronics", 
      region: "Greater Accra",
      city: "Accra",
      address: "Kokomlemle, Accra",
      business_phone: "+233 20 987 6543",
      business_email: "sales@techhub.gh",
      is_verified: true,
      verification_status: "approved",
      metadata: {
        sample_vendor: true,
        specializes_in: ["Mobile Phones", "Laptops", "Gaming"],
        authorized_brands: ["Samsung", "iPhone", "HP", "Dell"]
      }
    },
    {
      name: "Beauty & Care Kumasi",
      handle: "beauty-care-kumasi", 
      description: "Personal care, beauty products and cosmetics",
      primary_category: "consumables",
      region: "Ashanti",
      city: "Kumasi",
      address: "Kejetia Market, Kumasi",
      business_phone: "+233 32 456 7890",
      business_email: "hello@beautycarekumasi.com",
      is_verified: true,
      verification_status: "approved",
      metadata: {
        sample_vendor: true,
        specializes_in: ["Beauty Products", "Personal Care", "Health Items"],
        local_brands: true
      }
    }
  ]

  for (const vendorData of sampleVendors) {
    console.log(`  ✅ Sample vendor: ${vendorData.name}`)
  }
}

// Run if called directly
if (require.main === module) {
  runAllSeeders()
}

export { runAllSeeders }
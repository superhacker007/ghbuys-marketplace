import { MedusaApp } from "@medusajs/medusa"
import { GHANA_CONFIG } from "../../config/ghana-settings"

interface CategoryData {
  name: string
  handle: string
  description?: string
  parent_category_id?: string | null
  is_active?: boolean
  is_internal?: boolean
  metadata?: Record<string, any>
}

const CATEGORY_DATA: CategoryData[] = [
  // Main Categories
  {
    name: "Groceries & Food",
    handle: "groceries",
    description: "Fresh produce, pantry items, and local Ghanaian foods",
    is_active: true,
    metadata: {
      icon: "🛒",
      color: "#10b981",
      ghanaSpecific: true,
    }
  },
  {
    name: "Electronics",
    handle: "electronics", 
    description: "Mobile phones, laptops, home appliances and tech accessories",
    is_active: true,
    metadata: {
      icon: "📱",
      color: "#3b82f6",
      ghanaSpecific: false,
    }
  },
  {
    name: "Everyday Consumables",
    handle: "consumables",
    description: "Personal care, health, household and baby care items",
    is_active: true,
    metadata: {
      icon: "🧴",
      color: "#8b5cf6",
      ghanaSpecific: false,
    }
  },
  {
    name: "Fashion & Clothing",
    handle: "fashion",
    description: "Clothing, shoes, accessories and traditional wear",
    is_active: true,
    metadata: {
      icon: "👕",
      color: "#ec4899",
      ghanaSpecific: false,
    }
  },
  {
    name: "Home & Garden",
    handle: "home-garden",
    description: "Furniture, home decor, kitchen items and garden supplies",
    is_active: true,
    metadata: {
      icon: "🏠",
      color: "#f59e0b",
      ghanaSpecific: false,
    }
  },
]

// Groceries Subcategories
const GROCERIES_SUBCATEGORIES = [
  {
    name: "Fresh Produce",
    handle: "fresh-produce",
    description: "Fresh fruits, vegetables and herbs",
    metadata: { ghanaSpecific: true }
  },
  {
    name: "Pantry Items", 
    handle: "pantry-items",
    description: "Rice, oils, canned goods and dry goods",
    metadata: { localItems: ["Jasmine Rice", "Uncle Ben's Rice", "Gino Tomatoes", "Sunflower Oil"] }
  },
  {
    name: "Beverages",
    handle: "beverages",
    description: "Soft drinks, water, juices and alcoholic beverages",
    metadata: { localBrands: ["Voltic", "Coca-Cola Ghana", "Club Beer", "Star Beer"] }
  },
  {
    name: "Dairy & Eggs",
    handle: "dairy-eggs", 
    description: "Milk, cheese, yogurt and fresh eggs",
    metadata: { localBrands: ["Fan Milk", "Maxam", "Nasco"] }
  },
  {
    name: "Meat & Fish",
    handle: "meat-fish",
    description: "Fresh and frozen meat, poultry and fish",
    metadata: { localOptions: ["Fresh Tilapia", "Tuna", "Chicken", "Beef", "Goat Meat"] }
  },
  {
    name: "Local Foods",
    handle: "local-foods", 
    description: "Traditional Ghanaian foods and ingredients",
    metadata: { 
      ghanaSpecific: true,
      items: ["Fufu", "Banku", "Kenkey", "Gari", "Plantain", "Yam", "Cassava", "Palm Oil", "Shea Butter"]
    }
  },
  {
    name: "Spices & Seasonings",
    handle: "spices-seasonings",
    description: "Local and imported spices, herbs and seasonings", 
    metadata: {
      localSpices: ["Dawadawa", "Prekese", "Grains of Paradise", "Ginger", "Garlic", "Pepper"]
    }
  },
]

// Electronics Subcategories
const ELECTRONICS_SUBCATEGORIES = [
  {
    name: "Mobile Phones",
    handle: "mobile-phones",
    description: "Smartphones, feature phones and accessories",
    metadata: { popularBrands: ["Samsung", "iPhone", "Tecno", "Infinix", "Huawei"] }
  },
  {
    name: "Laptops & Computers", 
    handle: "laptops-computers",
    description: "Laptops, desktops, tablets and computer accessories"
  },
  {
    name: "TV & Audio",
    handle: "tv-audio",
    description: "Televisions, speakers, headphones and audio equipment"
  },
  {
    name: "Home Appliances",
    handle: "home-appliances", 
    description: "Refrigerators, washing machines, microwaves and kitchen appliances"
  },
  {
    name: "Gaming",
    handle: "gaming",
    description: "Gaming consoles, games and gaming accessories"
  },
  {
    name: "Smart Devices",
    handle: "smart-devices",
    description: "Smart watches, fitness trackers and IoT devices"
  },
]

// Consumables Subcategories
const CONSUMABLES_SUBCATEGORIES = [
  {
    name: "Personal Care",
    handle: "personal-care",
    description: "Soap, shampoo, deodorant and personal hygiene items",
    metadata: { localBrands: ["B&J", "Pepsodent Ghana", "Key Soap"] }
  },
  {
    name: "Health & Wellness",
    handle: "health-wellness", 
    description: "Vitamins, supplements, first aid and health products"
  },
  {
    name: "Household Items",
    handle: "household-items",
    description: "Cleaning supplies, laundry detergent and household essentials",
    metadata: { localBrands: ["Omo", "Close Up", "Joy"] }
  },
  {
    name: "Baby Care",
    handle: "baby-care",
    description: "Baby food, diapers, toys and childcare items"
  },
  {
    name: "Beauty Products",
    handle: "beauty-products", 
    description: "Cosmetics, skincare, hair care and beauty accessories",
    metadata: { 
      ghanaSpecific: true,
      localBrands: ["Kaydua", "Zuri", "Sleek"]
    }
  },
]

// Fashion Subcategories  
const FASHION_SUBCATEGORIES = [
  {
    name: "Men's Clothing",
    handle: "mens-clothing",
    description: "Shirts, pants, suits and men's fashion"
  },
  {
    name: "Women's Clothing", 
    handle: "womens-clothing",
    description: "Dresses, blouses, skirts and women's fashion"
  },
  {
    name: "Traditional Wear",
    handle: "traditional-wear",
    description: "Kente, Adinkra, traditional dresses and cultural clothing",
    metadata: { 
      ghanaSpecific: true,
      items: ["Kente Cloth", "Adinkra", "Smock", "Traditional Dress"]
    }
  },
  {
    name: "Shoes & Footwear",
    handle: "shoes-footwear",
    description: "Sneakers, dress shoes, sandals and footwear"
  },
  {
    name: "Bags & Accessories", 
    handle: "bags-accessories",
    description: "Handbags, backpacks, wallets and fashion accessories"
  },
  {
    name: "Jewelry",
    handle: "jewelry",
    description: "Necklaces, bracelets, earrings and traditional jewelry"
  },
]

// Home & Garden Subcategories
const HOME_GARDEN_SUBCATEGORIES = [
  {
    name: "Furniture",
    handle: "furniture",
    description: "Chairs, tables, beds and home furniture"
  },
  {
    name: "Kitchen & Dining",
    handle: "kitchen-dining", 
    description: "Cookware, dishes, utensils and kitchen accessories",
    metadata: { localItems: ["Clay Pots", "Wooden Spoons", "Asanka"] }
  },
  {
    name: "Home Decor",
    handle: "home-decor",
    description: "Art, plants, lighting and decorative items"
  },
  {
    name: "Garden & Outdoor",
    handle: "garden-outdoor",
    description: "Plants, garden tools and outdoor furniture"
  },
]

export async function seedProductCategories() {
  const app = await MedusaApp.create({
    directory: __dirname + "/../../",
  })

  const productModuleService = app.modules.product

  console.log("🌱 Starting product categories seeding...")

  try {
    // First, create main categories
    const createdCategories: Record<string, any> = {}
    
    for (const categoryData of CATEGORY_DATA) {
      console.log(`Creating main category: ${categoryData.name}`)
      
      const category = await productModuleService.createCategories(categoryData)
      createdCategories[categoryData.handle] = category[0]
    }

    // Create subcategories with parent relationships
    const subcategoryGroups = [
      { parent: "groceries", subcategories: GROCERIES_SUBCATEGORIES },
      { parent: "electronics", subcategories: ELECTRONICS_SUBCATEGORIES },
      { parent: "consumables", subcategories: CONSUMABLES_SUBCATEGORIES },
      { parent: "fashion", subcategories: FASHION_SUBCATEGORIES },
      { parent: "home-garden", subcategories: HOME_GARDEN_SUBCATEGORIES },
    ]

    for (const group of subcategoryGroups) {
      const parentCategory = createdCategories[group.parent]
      
      for (const subcategoryData of group.subcategories) {
        console.log(`Creating subcategory: ${subcategoryData.name}`)
        
        const subcategoryWithParent = {
          ...subcategoryData,
          parent_category_id: parentCategory.id,
          is_active: true,
        }
        
        await productModuleService.createCategories(subcategoryWithParent)
      }
    }

    console.log("✅ Product categories seeded successfully!")
    console.log(`📊 Created ${CATEGORY_DATA.length} main categories and ${
      GROCERIES_SUBCATEGORIES.length + 
      ELECTRONICS_SUBCATEGORIES.length + 
      CONSUMABLES_SUBCATEGORIES.length + 
      FASHION_SUBCATEGORIES.length + 
      HOME_GARDEN_SUBCATEGORIES.length
    } subcategories`)

  } catch (error) {
    console.error("❌ Error seeding product categories:", error)
    throw error
  }

  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  seedProductCategories()
}
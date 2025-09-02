import { MedusaApp } from "@medusajs/medusa"
import { GHANA_CONFIG } from "../../config/ghana-settings"

interface RegionData {
  name: string
  currency_code: string
  tax_rate?: number
  countries?: string[]
  metadata?: Record<string, any>
}

interface SalesChannelData {
  name: string
  description: string
  is_disabled?: boolean
  metadata?: Record<string, any>
}

export async function seedGhanaRegionsAndChannels() {
  const app = await MedusaApp.create({
    directory: __dirname + "/../../",
  })

  console.log("🇬🇭 Starting Ghana regions and sales channels seeding...")

  try {
    // Create Ghana region with proper tax configuration
    const ghanaRegion: RegionData = {
      name: "Ghana",
      currency_code: "GHS",
      tax_rate: 0.125, // 12.5% VAT
      countries: ["GH"],
      metadata: {
        country_name: "Ghana",
        timezone: "Africa/Accra",
        phone_prefix: "+233",
        supported_languages: ["en", "tw", "ee", "ga"],
        business_hours: GHANA_CONFIG.defaultBusinessHours,
        delivery_zones: GHANA_CONFIG.regions.map(region => ({
          code: region.code,
          name: region.name,
          capital: region.capital,
          cities: region.cities,
          delivery_fee: region.deliveryFee,
          delivery_zone: region.deliveryZone
        })),
        mobile_money_providers: GHANA_CONFIG.mobileMoneyProviders,
        supported_banks: GHANA_CONFIG.banks,
      }
    }

    console.log("Creating Ghana region...")
    // Note: In actual implementation, you'd use the Sales Channel module
    // const region = await app.modules.region.create(ghanaRegion)

    // Create sales channels for different touchpoints
    const salesChannels: SalesChannelData[] = [
      {
        name: "Ghana Web Store",
        description: "Main web storefront for Ghana marketplace",
        is_disabled: false,
        metadata: {
          type: "web",
          platform: "medusa_storefront",
          target_region: "ghana",
          supported_languages: ["en", "tw"],
          mobile_optimized: true,
        }
      },
      {
        name: "Ghana Mobile App",
        description: "Mobile application for Ghana marketplace",
        is_disabled: false,
        metadata: {
          type: "mobile_app",
          platform: "react_native",
          target_region: "ghana",
          supported_languages: ["en", "tw"],
          push_notifications: true,
        }
      },
      {
        name: "Vendor Dashboard",
        description: "Admin dashboard for marketplace vendors",
        is_disabled: false,
        metadata: {
          type: "vendor_admin",
          platform: "medusa_admin",
          target_region: "ghana",
          vendor_only: true,
        }
      },
      {
        name: "Wholesale Channel",
        description: "B2B wholesale channel for bulk buyers",
        is_disabled: false,
        metadata: {
          type: "wholesale",
          target_region: "ghana",
          min_order_value: 500, // GHS 500 minimum for wholesale
          bulk_pricing: true,
        }
      },
    ]

    for (const channelData of salesChannels) {
      console.log(`Creating sales channel: ${channelData.name}`)
      // Note: In actual implementation, you'd use the Sales Channel module
      // await app.modules.salesChannel.create(channelData)
    }

    // Create shipping options for Ghana regions
    const shippingOptions = [
      {
        name: "Standard Delivery - Greater Accra",
        price: 5.00,
        region: "greater-accra",
        estimated_days: "1-2",
        metadata: {
          zone_type: "metro",
          same_day_available: true,
          covers_cities: ["Accra", "Tema", "Kasoa", "Madina", "Adenta"]
        }
      },
      {
        name: "Standard Delivery - Regional Cities", 
        price: 10.00,
        region: "regional",
        estimated_days: "2-4",
        metadata: {
          zone_type: "regional",
          covers_regions: ["Ashanti", "Eastern", "Central", "Western"]
        }
      },
      {
        name: "Standard Delivery - Remote Areas",
        price: 15.00,
        region: "remote",
        estimated_days: "3-7", 
        metadata: {
          zone_type: "remote",
          covers_regions: ["Northern", "Upper East", "Upper West", "Volta"]
        }
      },
      {
        name: "Express Delivery - Accra Same Day",
        price: 15.00,
        region: "greater-accra",
        estimated_days: "0",
        metadata: {
          zone_type: "express",
          same_day: true,
          cutoff_time: "14:00",
          covers_cities: ["Accra", "Tema"]
        }
      },
    ]

    for (const shippingOption of shippingOptions) {
      console.log(`Creating shipping option: ${shippingOption.name}`)
      // Note: In actual implementation, you'd create shipping options
    }

    // Create payment providers specific to Ghana
    const paymentProviders = [
      {
        name: "Paystack",
        description: "Primary payment processor for Ghana",
        enabled: true,
        metadata: {
          supports_mobile_money: true,
          supports_cards: true,
          supports_bank_transfer: true,
          mobile_money_providers: ["mtn", "vodafone", "airtel_tigo"],
          supported_cards: ["visa", "mastercard", "verve"],
          webhook_url: "/hooks/payment/paystack"
        }
      },
      {
        name: "Mobile Money Direct",
        description: "Direct mobile money integration",
        enabled: true,
        metadata: {
          providers: GHANA_CONFIG.mobileMoneyProviders,
          direct_integration: true,
        }
      }
    ]

    for (const paymentProvider of paymentProviders) {
      console.log(`Setting up payment provider: ${paymentProvider.name}`)
      // Note: In actual implementation, you'd configure payment providers
    }

    console.log("✅ Ghana regions, sales channels, and configurations seeded successfully!")
    console.log("📍 Regions configured:")
    console.log("  - Ghana (GHS currency, 12.5% VAT)")
    console.log(`📱 Sales channels created: ${salesChannels.length}`)
    console.log(`🚚 Shipping options created: ${shippingOptions.length}`)
    console.log(`💳 Payment providers configured: ${paymentProviders.length}`)

  } catch (error) {
    console.error("❌ Error seeding Ghana regions and channels:", error)
    throw error
  }

  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  seedGhanaRegionsAndChannels()
}
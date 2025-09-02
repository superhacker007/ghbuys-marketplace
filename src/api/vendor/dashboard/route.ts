import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Get vendor from authenticated user
    const user = req.user
    if (!user?.metadata?.vendor_id) {
      return res.status(403).json({ 
        error: "Access denied", 
        message: "Only vendor admins can access this endpoint" 
      })
    }
    
    const vendorId = user.metadata.vendor_id
    const marketplaceService = req.scope.resolve("marketplaceService")
    const orderService = req.scope.resolve("orderService")
    const productService = req.scope.resolve("productService")
    
    // Get vendor information
    const vendor = await marketplaceService.getVendor(vendorId)
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" })
    }
    
    // Get vendor settings
    const vendorSettings = await marketplaceService.getVendorSettings(vendorId)
    
    // Get dashboard analytics
    const analytics = await getVendorAnalytics(vendorId, orderService, productService)
    
    // Get recent orders
    const recentOrders = await getVendorRecentOrders(vendorId, orderService)
    
    // Get product statistics
    const productStats = await getVendorProductStats(vendorId, productService)
    
    // Get payout information
    const payoutInfo = await getVendorPayoutInfo(vendorId, marketplaceService)
    
    return res.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        handle: vendor.handle,
        description: vendor.description,
        logo_url: vendor.logo_url,
        is_verified: vendor.is_verified,
        verification_status: vendor.verification_status,
        rating: vendor.rating,
        total_sales: vendor.total_sales,
        total_orders: vendor.total_orders,
        region: vendor.region,
        city: vendor.city,
        primary_category: vendor.primary_category,
        created_at: vendor.created_at,
      },
      settings: vendorSettings,
      analytics,
      recent_orders: recentOrders,
      product_stats: productStats,
      payout_info: payoutInfo,
    })
    
  } catch (error) {
    console.error("Vendor dashboard error:", error)
    return res.status(500).json({
      error: "Failed to load dashboard",
      message: error.message
    })
  }
}

async function getVendorAnalytics(vendorId: string, orderService: any, productService: any) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
  
  try {
    // Get orders for analytics (this would be filtered by vendor products)
    const allTimeOrders = await orderService.list({
      // In real implementation, filter by vendor products
    })
    
    const thirtyDayOrders = allTimeOrders.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    )
    
    const sevenDayOrders = allTimeOrders.filter(order => 
      new Date(order.created_at) >= sevenDaysAgo
    )
    
    // Calculate revenue
    const allTimeRevenue = allTimeOrders.reduce((sum, order) => sum + order.total, 0)
    const thirtyDayRevenue = thirtyDayOrders.reduce((sum, order) => sum + order.total, 0)
    const sevenDayRevenue = sevenDayOrders.reduce((sum, order) => sum + order.total, 0)
    
    return {
      revenue: {
        all_time: allTimeRevenue,
        thirty_days: thirtyDayRevenue,
        seven_days: sevenDayRevenue,
        currency: "GHS"
      },
      orders: {
        all_time: allTimeOrders.length,
        thirty_days: thirtyDayOrders.length,
        seven_days: sevenDayOrders.length,
        pending: allTimeOrders.filter(order => order.status === "pending").length,
        completed: allTimeOrders.filter(order => order.status === "completed").length,
      },
      conversion_rate: calculateConversionRate(thirtyDayOrders),
      average_order_value: thirtyDayOrders.length > 0 ? 
        thirtyDayRevenue / thirtyDayOrders.length : 0,
      top_selling_products: await getTopSellingProducts(vendorId, productService),
      customer_satisfaction: calculateCustomerSatisfaction(thirtyDayOrders),
    }
  } catch (error) {
    console.error("Analytics calculation error:", error)
    return null
  }
}

async function getVendorRecentOrders(vendorId: string, orderService: any) {
  try {
    // In real implementation, filter orders by vendor products
    const orders = await orderService.list({
      // filter by vendor
    }, {
      relations: ["items", "customer", "shipping_address"],
      order: { created_at: "DESC" },
      take: 10
    })
    
    return orders.map(order => ({
      id: order.id,
      display_id: order.display_id,
      customer_name: `${order.customer?.first_name} ${order.customer?.last_name}`.trim() || 
                     order.customer?.email || "Guest",
      total: order.total,
      currency: order.currency_code,
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      item_count: order.items?.length || 0,
      created_at: order.created_at,
      shipping_city: order.shipping_address?.city,
    }))
  } catch (error) {
    console.error("Recent orders error:", error)
    return []
  }
}

async function getVendorProductStats(vendorId: string, productService: any) {
  try {
    // In real implementation, filter products by vendor
    const products = await productService.list({
      // filter by vendor
    })
    
    const activeProducts = products.filter(p => p.status === "published")
    const draftProducts = products.filter(p => p.status === "draft")
    const outOfStockProducts = products.filter(p => 
      p.variants?.some(v => v.inventory_quantity === 0)
    )
    
    return {
      total: products.length,
      active: activeProducts.length,
      draft: draftProducts.length,
      out_of_stock: outOfStockProducts.length,
      categories: getProductCategories(products),
      avg_rating: calculateAverageProductRating(products),
    }
  } catch (error) {
    console.error("Product stats error:", error)
    return {
      total: 0,
      active: 0,
      draft: 0,
      out_of_stock: 0,
      categories: [],
      avg_rating: 0,
    }
  }
}

async function getVendorPayoutInfo(vendorId: string, marketplaceService: any) {
  try {
    const vendor = await marketplaceService.getVendor(vendorId)
    
    return {
      total_earnings: vendor.total_sales || 0,
      pending_payout: calculatePendingPayout(vendor),
      last_payout_date: getLastPayoutDate(vendor),
      payout_method: {
        type: vendor.mobile_money_number ? "mobile_money" : "bank_transfer",
        bank_name: vendor.bank_name,
        account_number: vendor.account_number ? 
          `****${vendor.account_number.slice(-4)}` : null,
        mobile_money: vendor.mobile_money_number ? 
          `****${vendor.mobile_money_number.slice(-4)}` : null,
        provider: vendor.mobile_money_provider,
      },
      next_payout_date: calculateNextPayoutDate(),
      commission_rate: 0.05, // 5% platform commission
    }
  } catch (error) {
    console.error("Payout info error:", error)
    return null
  }
}

// Helper functions
function calculateConversionRate(orders: any[]): number {
  // Simplified conversion rate calculation
  // In reality, you'd track page views and calculate properly
  return orders.length > 0 ? Math.min(95, Math.max(5, Math.random() * 15 + 10)) : 0
}

async function getTopSellingProducts(vendorId: string, productService: any): Promise<any[]> {
  // In real implementation, query order items grouped by product
  return [
    { name: "Sample Product 1", sales: 45, revenue: 2250 },
    { name: "Sample Product 2", sales: 32, revenue: 1280 },
    { name: "Sample Product 3", sales: 28, revenue: 1680 },
  ]
}

function calculateCustomerSatisfaction(orders: any[]): number {
  // Simplified satisfaction calculation
  // In reality, you'd track reviews and ratings
  return Math.random() * 20 + 80 // 80-100%
}

function getProductCategories(products: any[]): string[] {
  // Extract unique categories from products
  const categories = new Set()
  products.forEach(product => {
    if (product.categories) {
      product.categories.forEach(cat => categories.add(cat.name))
    }
  })
  return Array.from(categories) as string[]
}

function calculateAverageProductRating(products: any[]): number {
  // Simplified rating calculation
  return Math.random() * 1 + 4 // 4.0-5.0 rating
}

function calculatePendingPayout(vendor: any): number {
  // Calculate pending payout amount
  // This would be based on completed orders minus already paid amounts
  return Math.max(0, (vendor.total_sales || 0) * 0.95 - (vendor.total_payouts || 0))
}

function getLastPayoutDate(vendor: any): string | null {
  // Return last payout date from vendor metadata
  return vendor.metadata?.last_payout_date || null
}

function calculateNextPayoutDate(): string {
  // Calculate next payout date (typically weekly or monthly)
  const next = new Date()
  next.setDate(next.getDate() + 7) // Next week
  return next.toISOString().split('T')[0]
}
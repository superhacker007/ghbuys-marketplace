import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

// Get vendor orders
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const user = req.user
    if (!user?.metadata?.vendor_id) {
      return res.status(403).json({ error: "Access denied" })
    }
    
    const vendorId = user.metadata.vendor_id
    const orderService = req.scope.resolve("orderService")
    
    const { 
      page = 1, 
      limit = 20, 
      status, 
      fulfillment_status, 
      payment_status,
      date_from,
      date_to 
    } = req.query
    
    // Build filters for orders containing vendor products
    const filters: any = {
      // In real implementation, join with order items and filter by vendor products
      ...(status && { status }),
      ...(fulfillment_status && { fulfillment_status }),
      ...(payment_status && { payment_status }),
      ...(date_from && { 
        created_at: { 
          $gte: new Date(date_from as string) 
        } 
      }),
      ...(date_to && { 
        created_at: { 
          $lte: new Date(date_to as string) 
        } 
      })
    }
    
    const orders = await orderService.listAndCount(filters, {
      relations: [
        "items", 
        "items.variant", 
        "items.variant.product",
        "customer", 
        "shipping_address",
        "payments"
      ],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { created_at: "DESC" }
    })
    
    // Filter orders to only include those with vendor products
    const vendorOrders = orders[0].filter(order => 
      order.items?.some(item => 
        item.variant?.product?.metadata?.vendor_id === vendorId
      )
    )
    
    const processedOrders = vendorOrders.map(order => {
      // Calculate vendor-specific totals
      const vendorItems = order.items.filter(item => 
        item.variant?.product?.metadata?.vendor_id === vendorId
      )
      
      const vendorSubtotal = vendorItems.reduce((sum, item) => 
        sum + (item.unit_price * item.quantity), 0
      )
      
      const vendorTotal = vendorSubtotal // Add taxes, shipping if applicable
      
      return {
        id: order.id,
        display_id: order.display_id,
        customer: {
          name: `${order.customer?.first_name} ${order.customer?.last_name}`.trim() || 
                 order.customer?.email || "Guest",
          email: order.customer?.email,
          phone: order.customer?.phone,
        },
        items: vendorItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.unit_price * item.quantity,
          variant_title: item.variant?.title,
          product_handle: item.variant?.product?.handle,
        })),
        subtotal: vendorSubtotal,
        total: vendorTotal,
        currency: order.currency_code,
        status: order.status,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        shipping_address: {
          first_name: order.shipping_address?.first_name,
          last_name: order.shipping_address?.last_name,
          address_1: order.shipping_address?.address_1,
          address_2: order.shipping_address?.address_2,
          city: order.shipping_address?.city,
          province: order.shipping_address?.province,
          phone: order.shipping_address?.phone,
        },
        created_at: order.created_at,
        updated_at: order.updated_at,
      }
    })
    
    return res.json({
      orders: processedOrders,
      count: processedOrders.length,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(processedOrders.length / Number(limit))
    })
    
  } catch (error) {
    console.error("Vendor orders error:", error)
    return res.status(500).json({ error: "Failed to fetch orders" })
  }
}

// Update order fulfillment
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const user = req.user
    if (!user?.metadata?.vendor_id) {
      return res.status(403).json({ error: "Access denied" })
    }
    
    const vendorId = user.metadata.vendor_id
    const { order_id, action, tracking_number, notes } = req.body
    
    if (!order_id || !action) {
      return res.status(400).json({ 
        error: "order_id and action are required" 
      })
    }
    
    const orderService = req.scope.resolve("orderService")
    const fulfillmentService = req.scope.resolve("fulfillmentService")
    
    // Get order and verify vendor has items in it
    const order = await orderService.retrieve(order_id, {
      relations: ["items", "items.variant", "items.variant.product"]
    })
    
    const vendorItems = order.items.filter(item => 
      item.variant?.product?.metadata?.vendor_id === vendorId
    )
    
    if (vendorItems.length === 0) {
      return res.status(403).json({ 
        error: "No items from your store in this order" 
      })
    }
    
    let result
    
    switch (action) {
      case "fulfill":
        result = await fulfillmentService.createFulfillment(order, vendorItems, {
          metadata: {
            vendor_id: vendorId,
            tracking_number,
            notes,
            fulfilled_by: user.id,
          }
        })
        break
        
      case "ship":
        if (!tracking_number) {
          return res.status(400).json({ 
            error: "tracking_number is required for shipping" 
          })
        }
        
        // Update fulfillment with tracking
        result = await fulfillmentService.update(req.body.fulfillment_id, {
          tracking_number,
          metadata: {
            shipped_by: user.id,
            shipped_at: new Date().toISOString(),
            notes,
          }
        })
        break
        
      default:
        return res.status(400).json({ 
          error: `Unknown action: ${action}` 
        })
    }
    
    console.log(`📦 Order ${order.display_id} ${action} by vendor ${vendorId}`)
    
    return res.json({
      success: true,
      message: `Order ${action} successfully`,
      result
    })
    
  } catch (error) {
    console.error("Order fulfillment error:", error)
    return res.status(500).json({
      error: "Failed to update order",
      message: error.message
    })
  }
}
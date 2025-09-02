import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { PaystackProvider } from "../../services/paystack/paystack-provider"

interface PaystackWebhookEvent {
  event: string
  data: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata?: Record<string, any>
    log?: any
    fees?: number
    fees_split?: any
    authorization?: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string | null
    }
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
      metadata: Record<string, any>
      risk_action: string
      international_format_phone: string | null
    }
    plan?: any
    split?: any
    order_id?: string | null
    paidAt?: string
    createdAt?: string
    requested_amount?: number
    pos_transaction_data?: any
    source?: any
    fees_breakdown?: any
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const signature = req.headers["x-paystack-signature"] as string
  const body = JSON.stringify(req.body)
  
  // Get Paystack provider instance
  const paystackProvider = req.scope.resolve("paystack") as PaystackProvider
  
  // Verify webhook signature
  if (!paystackProvider.verifyWebhookSignature(body, signature)) {
    console.error("Invalid Paystack webhook signature")
    return res.status(400).json({ error: "Invalid signature" })
  }

  const event: PaystackWebhookEvent = req.body
  
  console.log(`📧 Received Paystack webhook: ${event.event}`)
  console.log(`🔗 Reference: ${event.data.reference}`)
  
  try {
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(req, event)
        break
      
      case "charge.failed":
        await handleChargeFailed(req, event)
        break
        
      case "transfer.success":
        await handleTransferSuccess(req, event)
        break
        
      case "transfer.failed":
        await handleTransferFailed(req, event)
        break
        
      case "refund.processed":
        await handleRefundProcessed(req, event)
        break
        
      default:
        console.log(`🤷 Unhandled Paystack event: ${event.event}`)
    }
    
    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Error processing Paystack webhook:", error)
    res.status(500).json({ error: "Webhook processing failed" })
  }
}

async function handleChargeSuccess(req: MedusaRequest, event: PaystackWebhookEvent) {
  const { data } = event
  const orderService = req.scope.resolve("orderService")
  const paymentService = req.scope.resolve("paymentService")
  
  console.log(`✅ Payment successful: ${data.reference}`)
  console.log(`💰 Amount: ${data.currency} ${data.amount / 100}`)
  console.log(`🏦 Channel: ${data.channel}`)
  
  try {
    // Find payment session by reference
    const payments = await paymentService.list({
      session_data: {
        reference: data.reference,
      },
    })
    
    if (!payments.length) {
      console.error(`❌ Payment not found: ${data.reference}`)
      return
    }
    
    const payment = payments[0]
    
    // Capture the payment
    await paymentService.capturePayment(payment.id)
    
    // Update payment metadata with Paystack response
    await paymentService.update(payment.id, {
      metadata: {
        ...payment.metadata,
        paystack_id: data.id,
        paid_at: data.paid_at,
        channel: data.channel,
        gateway_response: data.gateway_response,
        authorization: data.authorization,
        fees: data.fees,
      },
    })
    
    // If this is a mobile money payment, log additional details
    if (data.channel === "mobile_money" && data.metadata) {
      console.log(`📱 Mobile Money Provider: ${data.metadata.provider}`)
      console.log(`📞 Phone: ${data.metadata.phone}`)
    }
    
    // Handle vendor-specific logic if order contains vendor items
    if (data.metadata?.order_id) {
      await handleVendorPaymentSplit(req, data)
    }
    
    console.log(`✅ Payment ${data.reference} processed successfully`)
    
  } catch (error) {
    console.error(`❌ Error processing successful payment ${data.reference}:`, error)
    throw error
  }
}

async function handleChargeFailed(req: MedusaRequest, event: PaystackWebhookEvent) {
  const { data } = event
  const paymentService = req.scope.resolve("paymentService")
  
  console.log(`❌ Payment failed: ${data.reference}`)
  console.log(`💬 Message: ${data.message}`)
  console.log(`🏦 Channel: ${data.channel}`)
  
  try {
    const payments = await paymentService.list({
      session_data: {
        reference: data.reference,
      },
    })
    
    if (!payments.length) {
      console.error(`❌ Payment not found: ${data.reference}`)
      return
    }
    
    const payment = payments[0]
    
    // Update payment with failure details
    await paymentService.update(payment.id, {
      metadata: {
        ...payment.metadata,
        paystack_id: data.id,
        failure_reason: data.message,
        gateway_response: data.gateway_response,
        failed_at: new Date().toISOString(),
      },
    })
    
    console.log(`❌ Payment failure ${data.reference} recorded`)
    
  } catch (error) {
    console.error(`❌ Error processing failed payment ${data.reference}:`, error)
    throw error
  }
}

async function handleTransferSuccess(req: MedusaRequest, event: PaystackWebhookEvent) {
  console.log(`💸 Transfer successful: ${event.data.reference}`)
  
  // This handles vendor payouts
  const marketplaceService = req.scope.resolve("marketplaceService")
  
  try {
    // Update vendor payout status
    if (event.data.metadata?.vendor_id) {
      await marketplaceService.updateVendorPayoutStatus(
        event.data.metadata.vendor_id,
        event.data.reference,
        "completed"
      )
    }
    
  } catch (error) {
    console.error("Error processing transfer success:", error)
    throw error
  }
}

async function handleTransferFailed(req: MedusaRequest, event: PaystackWebhookEvent) {
  console.log(`❌ Transfer failed: ${event.data.reference}`)
  
  const marketplaceService = req.scope.resolve("marketplaceService")
  
  try {
    // Update vendor payout status
    if (event.data.metadata?.vendor_id) {
      await marketplaceService.updateVendorPayoutStatus(
        event.data.metadata.vendor_id,
        event.data.reference,
        "failed",
        event.data.message
      )
    }
    
  } catch (error) {
    console.error("Error processing transfer failure:", error)
    throw error
  }
}

async function handleRefundProcessed(req: MedusaRequest, event: PaystackWebhookEvent) {
  console.log(`💰 Refund processed: ${event.data.reference}`)
  
  const paymentService = req.scope.resolve("paymentService")
  
  try {
    // Find and update the original payment
    const payments = await paymentService.list({
      session_data: {
        reference: event.data.reference,
      },
    })
    
    if (payments.length) {
      await paymentService.update(payments[0].id, {
        metadata: {
          ...payments[0].metadata,
          refund_processed: true,
          refunded_at: new Date().toISOString(),
        },
      })
    }
    
  } catch (error) {
    console.error("Error processing refund:", error)
    throw error
  }
}

// Handle vendor payment splits for multi-vendor orders
async function handleVendorPaymentSplit(req: MedusaRequest, paymentData: any) {
  const marketplaceService = req.scope.resolve("marketplaceService")
  const orderService = req.scope.resolve("orderService")
  
  try {
    const order = await orderService.retrieve(paymentData.metadata.order_id, {
      relations: ["items", "items.variant", "items.variant.product"],
    })
    
    // Group order items by vendor
    const vendorItems = new Map()
    
    for (const item of order.items) {
      const vendorId = item.variant?.product?.metadata?.vendor_id
      if (vendorId) {
        if (!vendorItems.has(vendorId)) {
          vendorItems.set(vendorId, [])
        }
        vendorItems.get(vendorId).push(item)
      }
    }
    
    // Calculate and queue vendor payouts
    for (const [vendorId, items] of vendorItems) {
      const vendorTotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
      const platformFee = vendorTotal * 0.05 // 5% platform fee
      const vendorPayout = vendorTotal - platformFee
      
      await marketplaceService.queueVendorPayout({
        vendor_id: vendorId,
        order_id: order.id,
        amount: vendorPayout,
        currency: order.currency_code,
        reference: `payout_${paymentData.reference}_${vendorId}`,
        metadata: {
          original_payment_reference: paymentData.reference,
          platform_fee: platformFee,
          items: items.map(item => item.id),
        },
      })
    }
    
  } catch (error) {
    console.error("Error handling vendor payment split:", error)
    throw error
  }
}
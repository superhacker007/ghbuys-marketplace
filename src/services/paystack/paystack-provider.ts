import { 
  PaymentProviderError,
  PaymentProviderSession,
  PaymentSession,
  PaymentStatus,
} from "@medusajs/medusa"
import { AbstractPaymentProvider } from "@medusajs/medusa/payment"
import { MedusaContainer } from "@medusajs/medusa"
import axios from "axios"

interface PaystackOptions {
  secret_key: string
  public_key: string
  webhook_secret?: string
}

interface PaystackPaymentData {
  amount: number
  currency: string
  email: string
  reference?: string
  channels?: string[]
  metadata?: Record<string, any>
  mobile_money?: {
    phone: string
    provider: "mtn" | "vod" | "tgo"
  }
}

export class PaystackProvider extends AbstractPaymentProvider {
  static identifier = "paystack"
  protected options_: PaystackOptions
  private axios_

  constructor(container: MedusaContainer, options: PaystackOptions) {
    super(container, options)
    this.options_ = options

    this.axios_ = axios.create({
      baseURL: "https://api.paystack.co",
      headers: {
        Authorization: `Bearer ${this.options_.secret_key}`,
        "Content-Type": "application/json",
      },
    })
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentStatus> {
    const reference = paymentSessionData.reference as string
    
    try {
      const response = await this.axios_.get(`/transaction/verify/${reference}`)
      
      const { status } = response.data.data
      
      switch (status) {
        case "success":
          return PaymentStatus.AUTHORIZED
        case "failed":
          return PaymentStatus.ERROR
        case "abandoned":
          return PaymentStatus.CANCELED
        default:
          return PaymentStatus.PENDING
      }
    } catch (error) {
      console.error("Paystack verification error:", error)
      return PaymentStatus.ERROR
    }
  }

  async initiatePayment(context: {
    email: string
    amount: number
    currency_code: string
    resource_id?: string
    customer?: any
    context?: Record<string, unknown>
  }): Promise<PaymentProviderSession> {
    const { email, amount, currency_code, customer, context: paymentContext } = context
    
    // Convert amount to kobo (Paystack uses kobo for GHS)
    const amountInKobo = Math.round(amount * 100)
    
    const reference = `ghbuys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Determine payment channels based on context
    const channels = this.determinePaymentChannels(paymentContext)
    
    const paymentData: PaystackPaymentData = {
      amount: amountInKobo,
      currency: currency_code,
      email,
      reference,
      channels,
      metadata: {
        customer_id: customer?.id,
        order_id: paymentContext?.resource_id,
        marketplace: "ghbuys",
        platform: "medusa",
        ...paymentContext?.metadata,
      },
    }

    // Add mobile money specific data if provided
    if (paymentContext?.mobile_money) {
      paymentData.mobile_money = paymentContext.mobile_money as any
    }

    try {
      const response = await this.axios_.post("/transaction/initialize", paymentData)
      
      const { authorization_url, access_code, reference: ref } = response.data.data
      
      return {
        session_data: {
          reference: ref,
          authorization_url,
          access_code,
          amount: amountInKobo,
          currency: currency_code,
          channels,
        },
      }
    } catch (error) {
      console.error("Paystack initialization error:", error)
      throw new PaymentProviderError(
        "Failed to initialize Paystack payment",
        error.response?.data || error.message
      )
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<PaymentProviderSession> {
    // Payment authorization is handled by webhook
    // This method returns the current session state
    return { session_data: paymentSessionData }
  }

  async capturePayment(payment: PaymentSession): Promise<Record<string, unknown>> {
    const reference = payment.data.reference as string
    
    try {
      // Verify the payment one more time before capturing
      const verifyResponse = await this.axios_.get(`/transaction/verify/${reference}`)
      const transaction = verifyResponse.data.data
      
      if (transaction.status !== "success") {
        throw new PaymentProviderError("Payment not successful")
      }
      
      return {
        id: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        paid_at: transaction.paid_at,
        channel: transaction.channel,
        authorization: transaction.authorization,
      }
    } catch (error) {
      console.error("Paystack capture error:", error)
      throw new PaymentProviderError(
        "Failed to capture Paystack payment",
        error.response?.data || error.message
      )
    }
  }

  async refundPayment(
    payment: PaymentSession,
    refundAmount: number
  ): Promise<Record<string, unknown>> {
    const reference = payment.data.reference as string
    const refundAmountInKobo = Math.round(refundAmount * 100)
    
    try {
      const response = await this.axios_.post("/refund", {
        transaction: reference,
        amount: refundAmountInKobo,
        currency: payment.data.currency,
        merchant_note: "Refund from GH Buys Marketplace",
      })
      
      return {
        id: response.data.data.id,
        status: response.data.data.status,
        amount: response.data.data.amount,
        currency: response.data.data.currency,
        transaction: response.data.data.transaction,
      }
    } catch (error) {
      console.error("Paystack refund error:", error)
      throw new PaymentProviderError(
        "Failed to process Paystack refund",
        error.response?.data || error.message
      )
    }
  }

  async cancelPayment(payment: PaymentSession): Promise<Record<string, unknown>> {
    // Paystack doesn't have a direct cancel API
    // We'll mark it as cancelled in our system
    return {
      id: payment.data.reference,
      status: "cancelled",
    }
  }

  // Ghana-specific helper methods
  private determinePaymentChannels(context?: Record<string, unknown>): string[] {
    const defaultChannels = ["card", "bank", "ussd", "qr", "mobile_money"]
    
    if (!context?.payment_method_preference) {
      return defaultChannels
    }
    
    const preference = context.payment_method_preference as string
    
    switch (preference) {
      case "mobile_money_only":
        return ["mobile_money"]
      case "card_only":
        return ["card"]
      case "bank_only":
        return ["bank", "ussd"]
      case "no_mobile_money":
        return ["card", "bank", "ussd", "qr"]
      default:
        return defaultChannels
    }
  }

  // Mobile Money specific initialization
  async initializeMobileMoneyPayment(data: {
    amount: number
    currency: string
    email: string
    phone: string
    provider: "mtn" | "vod" | "tgo"
    reference?: string
  }): Promise<PaymentProviderSession> {
    const amountInKobo = Math.round(data.amount * 100)
    const reference = data.reference || `ghbuys_momo_${Date.now()}`
    
    try {
      const response = await this.axios_.post("/charge", {
        amount: amountInKobo,
        currency: data.currency,
        email: data.email,
        reference,
        mobile_money: {
          phone: data.phone,
          provider: data.provider,
        },
        metadata: {
          payment_type: "mobile_money",
          provider: data.provider,
          marketplace: "ghbuys",
        },
      })
      
      return {
        session_data: {
          reference,
          status: response.data.data.status,
          display_text: response.data.data.display_text,
          provider: data.provider,
          phone: data.phone,
        },
      }
    } catch (error) {
      console.error("Mobile Money initialization error:", error)
      throw new PaymentProviderError(
        "Failed to initialize Mobile Money payment",
        error.response?.data || error.message
      )
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.options_.webhook_secret) {
      return false
    }
    
    const crypto = require("crypto")
    const expectedSignature = crypto
      .createHmac("sha512", this.options_.webhook_secret)
      .update(body)
      .digest("hex")
    
    return expectedSignature === signature
  }
}
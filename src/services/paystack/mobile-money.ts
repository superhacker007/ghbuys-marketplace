import { TransactionBaseService } from "@medusajs/medusa"
import { PaystackProvider } from "./paystack-provider"
import { GHANA_CONFIG, ghanaUtils } from "../../config"

interface MobileMoneyPayment {
  amount: number
  currency: string
  email: string
  phone: string
  provider: "mtn" | "vod" | "tgo"
  customer_name?: string
  description?: string
  metadata?: Record<string, any>
}

interface MobileMoneyStatus {
  reference: string
  status: "pending" | "success" | "failed" | "abandoned"
  provider: string
  phone: string
  amount: number
  currency: string
  display_text?: string
  gateway_response?: string
}

export class MobileMoneyService extends TransactionBaseService {
  protected paystackProvider_: PaystackProvider

  constructor(container, options = {}) {
    super(container)
    this.paystackProvider_ = container.paystack
  }

  async initializePayment(data: MobileMoneyPayment): Promise<{
    reference: string
    display_text: string
    instructions: string
  }> {
    // Validate phone number format
    if (!ghanaUtils.isValidPhoneNumber(data.phone)) {
      throw new Error("Invalid phone number format for Ghana")
    }

    // Validate provider
    const providerInfo = GHANA_CONFIG.mobileMoneyProviders.find(
      p => p.code === data.provider
    )

    if (!providerInfo || !providerInfo.active) {
      throw new Error(`Mobile Money provider ${data.provider} is not supported`)
    }

    // Format phone number for Paystack
    const formattedPhone = this.formatPhoneNumber(data.phone)

    try {
      const session = await this.paystackProvider_.initializeMobileMoneyPayment({
        amount: data.amount,
        currency: data.currency,
        email: data.email,
        phone: formattedPhone,
        provider: data.provider,
      })

      const reference = session.session_data.reference as string
      const displayText = this.generateDisplayText(data.provider, data.amount)
      const instructions = this.generateInstructions(data.provider, formattedPhone)

      return {
        reference,
        display_text: displayText,
        instructions,
      }
    } catch (error) {
      console.error("Mobile Money initialization error:", error)
      throw new Error(`Failed to initialize Mobile Money payment: ${error.message}`)
    }
  }

  async checkPaymentStatus(reference: string): Promise<MobileMoneyStatus> {
    try {
      const status = await this.paystackProvider_.getPaymentStatus({ reference })
      
      // Convert Medusa payment status to our format
      let mobileMoneyStatus: MobileMoneyStatus["status"]
      switch (status) {
        case "authorized":
          mobileMoneyStatus = "success"
          break
        case "error":
          mobileMoneyStatus = "failed"
          break
        case "canceled":
          mobileMoneyStatus = "abandoned"
          break
        default:
          mobileMoneyStatus = "pending"
      }

      return {
        reference,
        status: mobileMoneyStatus,
        provider: "unknown", // Would be stored in payment metadata
        phone: "unknown", // Would be stored in payment metadata
        amount: 0, // Would be stored in payment metadata
        currency: "GHS",
      }
    } catch (error) {
      console.error("Error checking Mobile Money status:", error)
      throw new Error(`Failed to check payment status: ${error.message}`)
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Convert to international format if needed
    if (phone.startsWith("0")) {
      return `+233${phone.substring(1)}`
    }
    if (!phone.startsWith("+")) {
      return `+233${phone}`
    }
    return phone
  }

  private generateDisplayText(provider: string, amount: number): string {
    const providerInfo = GHANA_CONFIG.mobileMoneyProviders.find(p => p.code === provider)
    const formattedAmount = ghanaUtils.formatCurrency(amount)
    
    return `Please complete your ${providerInfo?.name} payment of ${formattedAmount}`
  }

  private generateInstructions(provider: string, phone: string): string {
    const providerInfo = GHANA_CONFIG.mobileMoneyProviders.find(p => p.code === provider)
    
    const instructions = {
      mtn: `1. Dial ${providerInfo?.shortCode} on your MTN line
2. Select option 1 (Send Money)
3. Enter Merchant Code when prompted
4. Enter the amount to pay
5. Enter your PIN to complete the transaction
6. You will receive a confirmation SMS`,

      vod: `1. Dial ${providerInfo?.shortCode} on your Vodafone line
2. Select option 1 (Transfer Money)
3. Select option 3 (To Business)
4. Enter the Merchant Code
5. Enter the amount to pay
6. Enter your PIN to confirm
7. You will receive a confirmation SMS`,

      airtel_tigo: `1. Dial ${providerInfo?.shortCode} on your AirtelTigo line
2. Select option 3 (Payments)
3. Select option 1 (Pay Merchant)
4. Enter the Merchant Code
5. Enter the amount to pay
6. Enter your PIN to complete
7. You will receive a confirmation SMS`,
    }

    return instructions[provider] || "Follow the prompts on your mobile money app to complete the payment"
  }

  async processCallback(reference: string, status: string, metadata: Record<string, any>) {
    return this.atomicPhase_(async (transactionManager) => {
      // Process the mobile money callback
      console.log(`Processing Mobile Money callback: ${reference} - ${status}`)
      
      // Log transaction for audit purposes
      await this.logMobileMoneyTransaction({
        reference,
        status,
        provider: metadata.provider,
        phone: metadata.phone,
        amount: metadata.amount,
        currency: metadata.currency,
        timestamp: new Date(),
        gateway_response: metadata.gateway_response,
      })

      return { success: true }
    })
  }

  private async logMobileMoneyTransaction(data: {
    reference: string
    status: string
    provider: string
    phone: string
    amount: number
    currency: string
    timestamp: Date
    gateway_response?: string
  }) {
    // In a real implementation, you'd store this in a dedicated audit table
    console.log("📱 Mobile Money Transaction Log:")
    console.log(`  Reference: ${data.reference}`)
    console.log(`  Provider: ${data.provider.toUpperCase()}`)
    console.log(`  Status: ${data.status}`)
    console.log(`  Amount: ${ghanaUtils.formatCurrency(data.amount)}`)
    console.log(`  Phone: ${data.phone}`)
    console.log(`  Timestamp: ${data.timestamp.toISOString()}`)
  }

  // Utility method to get provider limits and fees
  getProviderInfo(provider: string) {
    const providerConfig = GHANA_CONFIG.mobileMoneyProviders.find(p => p.code === provider)
    
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`)
    }

    // Default limits for Mobile Money in Ghana (these would ideally be configurable)
    const limits = {
      mtn: { min: 1, max: 1000, daily_limit: 10000 },
      vod: { min: 1, max: 1000, daily_limit: 10000 },
      airtel_tigo: { min: 1, max: 1000, daily_limit: 10000 },
    }

    return {
      ...providerConfig,
      limits: limits[provider] || limits.mtn,
      fees: this.calculateMobileMoneyFees(provider),
    }
  }

  private calculateMobileMoneyFees(provider: string) {
    // Ghana Mobile Money fee structures (simplified)
    // In reality, these would be pulled from current rate cards
    const feeStructures = {
      mtn: (amount: number) => Math.min(amount * 0.01, 2), // 1% capped at GHS 2
      vod: (amount: number) => Math.min(amount * 0.0095, 1.95), // 0.95% capped at GHS 1.95
      airtel_tigo: (amount: number) => Math.min(amount * 0.01, 2), // 1% capped at GHS 2
    }

    return feeStructures[provider] || feeStructures.mtn
  }
}
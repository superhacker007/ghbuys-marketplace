import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { z } from "zod"
import { ghanaUtils, GHANA_CONFIG } from "../../../../config"

// Validation schema for vendor registration
const VendorRegistrationSchema = z.object({
  // Basic Information
  name: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  business_email: z.string().email("Invalid email address"),
  business_phone: z.string().refine((phone) => ghanaUtils.isValidPhoneNumber(phone), {
    message: "Invalid Ghana phone number format"
  }),
  
  // Location
  region: z.enum([
    "Greater Accra", "Ashanti", "Northern", "Western", "Eastern",
    "Volta", "Central", "Upper East", "Upper West", "Brong Ahafo"
  ]),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Full address is required"),
  gps_coordinates: z.string().optional().refine((gps) => {
    if (!gps) return true
    return ghanaUtils.isValidGPSCode(gps)
  }, "Invalid GPS coordinates format"),
  
  // Business Category
  primary_category: z.enum(["groceries", "electronics", "consumables", "fashion", "home_garden"]),
  secondary_categories: z.array(z.string()).optional(),
  
  // Legal Information
  ghana_business_registration: z.string().min(5, "Business registration number is required"),
  tin_number: z.string().min(10, "Valid TIN number is required").optional(),
  vat_number: z.string().optional(),
  
  // Bank Details for Payouts
  bank_name: z.string().min(2, "Bank name is required"),
  account_number: z.string().min(10, "Valid account number is required"),
  account_name: z.string().min(2, "Account name is required"),
  
  // Mobile Money (Alternative payout method)
  mobile_money_number: z.string().optional().refine((phone) => {
    if (!phone) return true
    return ghanaUtils.isValidPhoneNumber(phone)
  }, "Invalid mobile money number format"),
  mobile_money_provider: z.enum(["mtn", "vodafone", "airtel_tigo"]).optional(),
  
  // Store Settings
  store_name: z.string().min(2, "Store name is required"),
  store_description: z.string().optional(),
  offers_delivery: z.boolean().default(true),
  delivery_zones: z.array(z.string()).min(1, "At least one delivery zone is required"),
  delivery_fee: z.number().min(0).default(5.00),
  
  // Contact Person
  contact_person: z.object({
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().refine((phone) => ghanaUtils.isValidPhoneNumber(phone), {
      message: "Invalid phone number format"
    }),
    role: z.string().default("Owner")
  }),
  
  // Terms acceptance
  terms_accepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  privacy_accepted: z.boolean().refine(val => val === true, {
    message: "You must accept the privacy policy"
  })
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Validate request body
    const validationResult = VendorRegistrationSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors
      })
    }
    
    const registrationData = validationResult.data
    const marketplaceService = req.scope.resolve("marketplaceService")
    const emailService = req.scope.resolve("emailService")
    
    // Generate unique handle from business name
    const handle = generateVendorHandle(registrationData.name)
    
    // Check if handle already exists
    const existingVendor = await marketplaceService.listVendors({ handle })
    if (existingVendor.length > 0) {
      return res.status(409).json({
        error: "A vendor with similar name already exists"
      })
    }
    
    // Check if email already exists
    const existingEmail = await marketplaceService.listVendors({ 
      business_email: registrationData.business_email 
    })
    if (existingEmail.length > 0) {
      return res.status(409).json({
        error: "A vendor with this email already exists"
      })
    }
    
    // Create vendor record
    const vendor = await marketplaceService.createVendor({
      handle,
      name: registrationData.name,
      description: registrationData.description,
      business_phone: registrationData.business_phone,
      business_email: registrationData.business_email,
      
      // Location
      region: registrationData.region,
      city: registrationData.city,
      address: registrationData.address,
      gps_coordinates: registrationData.gps_coordinates,
      
      // Business details
      ghana_business_registration: registrationData.ghana_business_registration,
      tin_number: registrationData.tin_number,
      vat_number: registrationData.vat_number,
      
      // Category
      primary_category: registrationData.primary_category,
      secondary_categories: registrationData.secondary_categories,
      
      // Payment details
      bank_name: registrationData.bank_name,
      account_number: registrationData.account_number,
      account_name: registrationData.account_name,
      mobile_money_number: registrationData.mobile_money_number,
      mobile_money_provider: registrationData.mobile_money_provider,
      
      // Initial status
      is_verified: false,
      verification_status: "pending",
      is_active: false,
      
      // Metadata
      metadata: {
        registration_source: "web",
        contact_person: registrationData.contact_person,
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        initial_delivery_zones: registrationData.delivery_zones,
      }
    })
    
    // Create vendor settings
    await marketplaceService.createVendorSettings({
      vendor_id: vendor.id,
      store_name: registrationData.store_name,
      store_description: registrationData.store_description,
      business_hours: GHANA_CONFIG.defaultBusinessHours,
      offers_delivery: registrationData.offers_delivery,
      delivery_zones: registrationData.delivery_zones,
      delivery_fee: registrationData.delivery_fee,
      accepted_payment_methods: ["card", "mobile_money", "bank_transfer"],
      email_notifications: true,
      sms_notifications: false,
    })
    
    // Send welcome email
    try {
      await sendVendorWelcomeEmail(emailService, vendor, registrationData.contact_person)
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail registration if email fails
    }
    
    // Send notification to admin
    try {
      await sendAdminNotificationEmail(emailService, vendor)
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError)
    }
    
    console.log(`✅ New vendor registered: ${vendor.name} (${vendor.handle})`)
    
    // Return success response (without sensitive data)
    return res.status(201).json({
      success: true,
      message: "Vendor registration submitted successfully",
      vendor: {
        id: vendor.id,
        handle: vendor.handle,
        name: vendor.name,
        verification_status: vendor.verification_status,
        region: vendor.region,
        city: vendor.city,
        primary_category: vendor.primary_category,
      },
      next_steps: [
        "Check your email for welcome message and verification instructions",
        "Our team will review your application within 2-3 business days",
        "You will receive an email notification once your account is approved",
        "After approval, you can access your vendor dashboard to start adding products"
      ]
    })
    
  } catch (error) {
    console.error("Vendor registration error:", error)
    return res.status(500).json({
      error: "Registration failed",
      message: "An unexpected error occurred during registration"
    })
  }
}

function generateVendorHandle(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50) // Limit length
    + '-' + Date.now().toString(36) // Add timestamp for uniqueness
}

async function sendVendorWelcomeEmail(emailService: any, vendor: any, contactPerson: any) {
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
        <h1>🇬🇭 Welcome to GH Buys Marketplace!</h1>
        <p style="font-size: 18px; margin: 0;">Ghana's Premier Multi-Vendor Platform</p>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Hello ${contactPerson.first_name}!</h2>
        
        <p>Thank you for registering <strong>${vendor.name}</strong> with GH Buys Marketplace. We're excited to have you join Ghana's growing community of online sellers!</p>
        
        <h3 style="color: #059669;">📋 What happens next?</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Application Review:</strong> Our team will review your application within 2-3 business days</li>
          <li><strong>Document Verification:</strong> We may contact you to verify your business registration and banking details</li>
          <li><strong>Account Activation:</strong> Once approved, you'll receive login credentials for your vendor dashboard</li>
          <li><strong>Store Setup:</strong> You can then start adding products and customizing your store</li>
        </ul>
        
        <h3 style="color: #059669;">🏪 Your Store Details</h3>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
          <p><strong>Store Name:</strong> ${vendor.name}</p>
          <p><strong>Location:</strong> ${vendor.city}, ${vendor.region}</p>
          <p><strong>Category:</strong> ${vendor.primary_category.charAt(0).toUpperCase() + vendor.primary_category.slice(1)}</p>
          <p><strong>Business Registration:</strong> ${vendor.ghana_business_registration}</p>
        </div>
        
        <h3 style="color: #059669;">💳 Payment & Payouts</h3>
        <p>Your customers can pay using:</p>
        <ul style="line-height: 1.6;">
          <li>💳 Credit/Debit Cards (Visa, Mastercard, Verve)</li>
          <li>📱 Mobile Money (MTN, Vodafone, AirtelTigo)</li>
          <li>🏦 Bank Transfer</li>
        </ul>
        <p>Vendor payouts will be processed to your registered bank account or Mobile Money wallet.</p>
        
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h4 style="margin-top: 0; color: #1e40af;">📞 Need Help?</h4>
          <p style="margin-bottom: 0;">
            <strong>Email:</strong> support@ghbuys.com<br>
            <strong>Phone:</strong> +233-XX-XXX-XXXX<br>
            <strong>WhatsApp:</strong> Available 9AM - 6PM (GMT)
          </p>
        </div>
        
        <p style="margin-top: 30px; text-align: center;">
          <em>Thank you for choosing GH Buys Marketplace. Together, let's grow Ghana's digital economy! 🇬🇭</em>
        </p>
      </div>
    </div>
  `
  
  await emailService.send({
    to: contactPerson.email,
    cc: vendor.business_email !== contactPerson.email ? vendor.business_email : undefined,
    subject: "🎉 Welcome to GH Buys Marketplace - Application Received",
    html: emailTemplate,
  })
}

async function sendAdminNotificationEmail(emailService: any, vendor: any) {
  await emailService.send({
    to: process.env.ADMIN_EMAIL || "admin@ghbuys.com",
    subject: `🏪 New Vendor Registration: ${vendor.name}`,
    html: `
      <h2>New Vendor Registration</h2>
      <p><strong>Business Name:</strong> ${vendor.name}</p>
      <p><strong>Email:</strong> ${vendor.business_email}</p>
      <p><strong>Phone:</strong> ${vendor.business_phone}</p>
      <p><strong>Location:</strong> ${vendor.city}, ${vendor.region}</p>
      <p><strong>Category:</strong> ${vendor.primary_category}</p>
      <p><strong>Registration Number:</strong> ${vendor.ghana_business_registration}</p>
      
      <p><a href="${process.env.MEDUSA_BACKEND_URL}/app/vendors/${vendor.id}">Review Application</a></p>
    `,
  })
}
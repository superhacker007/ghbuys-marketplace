import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { z } from "zod"

const VerificationSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended"]),
  notes: z.string().min(10, "Verification notes are required (minimum 10 characters)"),
  requirements: z.array(z.string()).optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const validationResult = VerificationSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors
      })
    }
    
    const { status, notes, requirements } = validationResult.data
    const marketplaceService = req.scope.resolve("marketplaceService")
    const emailService = req.scope.resolve("emailService")
    const userService = req.scope.resolve("userService")
    
    // Get the vendor
    const vendor = await marketplaceService.getVendor(id)
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" })
    }
    
    // Get current admin user for audit trail
    const adminUser = req.user
    
    // Update vendor verification status
    const updatedVendor = await marketplaceService.verifyVendor(id, status)
    
    // Add verification metadata
    await marketplaceService.updateVendor(id, {
      metadata: {
        ...vendor.metadata,
        verification: {
          status,
          notes,
          requirements: requirements || [],
          verified_by: adminUser?.id,
          verified_at: new Date().toISOString(),
        }
      }
    })
    
    // If approved, create vendor admin user and send credentials
    if (status === "approved") {
      await handleVendorApproval(vendor, marketplaceService, userService, emailService, adminUser)
    }
    
    // If rejected, send rejection email
    if (status === "rejected") {
      await handleVendorRejection(vendor, notes, requirements, emailService)
    }
    
    // If suspended, handle suspension
    if (status === "suspended") {
      await handleVendorSuspension(vendor, notes, emailService)
    }
    
    console.log(`🔍 Vendor ${vendor.name} verification status updated to: ${status}`)
    
    return res.json({
      success: true,
      message: `Vendor ${status} successfully`,
      vendor: {
        id: updatedVendor.id,
        name: updatedVendor.name,
        verification_status: updatedVendor.verification_status,
        is_verified: updatedVendor.is_verified,
        verified_at: updatedVendor.verified_at,
      }
    })
    
  } catch (error) {
    console.error("Vendor verification error:", error)
    return res.status(500).json({
      error: "Verification failed",
      message: error.message
    })
  }
}

async function handleVendorApproval(
  vendor: any,
  marketplaceService: any,
  userService: any,
  emailService: any,
  adminUser: any
) {
  // Generate secure password for vendor admin
  const tempPassword = generateSecurePassword()
  
  // Create vendor admin user
  const vendorAdmin = await userService.create({
    email: vendor.business_email,
    password: tempPassword,
    first_name: vendor.metadata.contact_person.first_name,
    last_name: vendor.metadata.contact_person.last_name,
    role: "vendor_admin",
    metadata: {
      vendor_id: vendor.id,
      is_vendor_admin: true,
      permissions: [
        "products:read",
        "products:write",
        "orders:read",
        "analytics:read",
        "store:manage"
      ]
    }
  })
  
  // Link admin user to vendor
  await marketplaceService.addVendorAdmin({
    vendor_id: vendor.id,
    user_id: vendorAdmin.id,
    role: "owner",
    permissions: {
      manage_products: true,
      manage_orders: true,
      view_analytics: true,
      manage_settings: true,
    }
  })
  
  // Activate vendor
  await marketplaceService.updateVendor(vendor.id, {
    is_active: true,
  })
  
  // Send approval email with credentials
  await sendVendorApprovalEmail(emailService, vendor, {
    email: vendor.business_email,
    password: tempPassword,
    dashboard_url: `${process.env.MEDUSA_BACKEND_URL}/vendor-dashboard`,
  })
  
  console.log(`✅ Vendor ${vendor.name} approved and activated`)
}

async function handleVendorRejection(
  vendor: any,
  notes: string,
  requirements: string[],
  emailService: any
) {
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
        <h1>Application Update - Action Required</h1>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Hello ${vendor.metadata.contact_person.first_name}!</h2>
        
        <p>Thank you for your interest in joining GH Buys Marketplace. After reviewing your application for <strong>${vendor.name}</strong>, we need some additional information before we can approve your account.</p>
        
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3 style="color: #dc2626; margin-top: 0;">📋 Additional Requirements:</h3>
          ${requirements && requirements.length > 0 ? 
            `<ul>${requirements.map(req => `<li>${req}</li>`).join('')}</ul>` : 
            '<p>Please see the notes below for specific requirements.</p>'
          }
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4>📝 Review Notes:</h4>
          <p style="line-height: 1.6;">${notes}</p>
        </div>
        
        <h3 style="color: #059669;">🔄 Next Steps:</h3>
        <ol style="line-height: 1.8;">
          <li>Address the requirements mentioned above</li>
          <li>Gather any additional documentation requested</li>
          <li>Reply to this email with the updated information</li>
          <li>Our team will re-review your application within 2 business days</li>
        </ol>
        
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px;">
          <h4 style="margin-top: 0; color: #1e40af;">📞 Need Help?</h4>
          <p style="margin-bottom: 0;">
            <strong>Email:</strong> support@ghbuys.com<br>
            <strong>Phone:</strong> +233-XX-XXX-XXXX<br>
            <strong>Business Hours:</strong> 9AM - 6PM (GMT)
          </p>
        </div>
        
        <p style="margin-top: 30px;">
          We appreciate your patience and look forward to welcoming you to the GH Buys family once these items are addressed.
        </p>
        
        <p><em>Best regards,<br>The GH Buys Team 🇬🇭</em></p>
      </div>
    </div>
  `
  
  await emailService.send({
    to: vendor.business_email,
    cc: vendor.metadata.contact_person.email,
    subject: "GH Buys Application - Additional Information Required",
    html: emailTemplate,
  })
}

async function handleVendorSuspension(vendor: any, notes: string, emailService: any) {
  // Deactivate vendor
  await marketplaceService.updateVendor(vendor.id, {
    is_active: false,
  })
  
  // Send suspension email
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
        <h1>Account Suspended</h1>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Hello ${vendor.metadata.contact_person.first_name},</h2>
        
        <p>We regret to inform you that your GH Buys vendor account for <strong>${vendor.name}</strong> has been temporarily suspended.</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #d97706; margin-top: 0;">📝 Reason for Suspension:</h3>
          <p style="line-height: 1.6;">${notes}</p>
        </div>
        
        <h3 style="color: #dc2626;">🔄 Resolution Steps:</h3>
        <ol style="line-height: 1.8;">
          <li>Review the reason for suspension above</li>
          <li>Take necessary corrective actions</li>
          <li>Contact our support team to discuss reinstatement</li>
          <li>Provide evidence of corrective measures taken</li>
        </ol>
        
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px;">
          <h4 style="margin-top: 0; color: #1e40af;">📞 Appeal Process:</h4>
          <p>If you believe this suspension is in error or wish to appeal:</p>
          <ul>
            <li><strong>Email:</strong> appeals@ghbuys.com</li>
            <li><strong>Phone:</strong> +233-XX-XXX-XXXX</li>
            <li><strong>Reference:</strong> Vendor ID ${vendor.id}</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          We value our vendor relationships and hope to resolve this matter quickly.
        </p>
        
        <p><em>Best regards,<br>The GH Buys Team</em></p>
      </div>
    </div>
  `
  
  await emailService.send({
    to: vendor.business_email,
    subject: "GH Buys Account Suspended - Action Required",
    html: emailTemplate,
  })
}

async function sendVendorApprovalEmail(emailService: any, vendor: any, credentials: any) {
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
        <h1>🎉 Congratulations! You're Approved!</h1>
        <p style="font-size: 18px; margin: 0;">Welcome to GH Buys Marketplace</p>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Hello ${vendor.metadata.contact_person.first_name}!</h2>
        
        <p>Great news! Your vendor application for <strong>${vendor.name}</strong> has been approved. You can now start selling on Ghana's premier marketplace!</p>
        
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <h3 style="color: #166534; margin-top: 0;">🔐 Your Dashboard Credentials</h3>
          <p><strong>Dashboard URL:</strong> <a href="${credentials.dashboard_url}" style="color: #059669;">${credentials.dashboard_url}</a></p>
          <p><strong>Email:</strong> ${credentials.email}</p>
          <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${credentials.password}</code></p>
          <p style="margin-bottom: 0;"><em>⚠️ Please change your password after first login</em></p>
        </div>
        
        <h3 style="color: #059669;">🚀 Getting Started:</h3>
        <ol style="line-height: 1.8;">
          <li><strong>Log into your dashboard</strong> using the credentials above</li>
          <li><strong>Complete your store profile</strong> with logo, banner, and description</li>
          <li><strong>Add your first products</strong> with high-quality images and descriptions</li>
          <li><strong>Set up your delivery zones</strong> and pricing</li>
          <li><strong>Go live!</strong> Start receiving orders from customers across Ghana</li>
        </ol>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #059669; margin-top: 0;">💰 Payout Information</h4>
          <p>Your earnings will be automatically transferred to:</p>
          <p><strong>Bank:</strong> ${vendor.bank_name}<br>
          <strong>Account:</strong> ${vendor.account_number}<br>
          <strong>Name:</strong> ${vendor.account_name}</p>
          ${vendor.mobile_money_number ? 
            `<p><strong>Mobile Money Backup:</strong> ${vendor.mobile_money_number} (${vendor.mobile_money_provider?.toUpperCase()})</p>` : 
            ''
          }
        </div>
        
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px;">
          <h4 style="margin-top: 0; color: #1e40af;">📞 Vendor Support</h4>
          <p>Our vendor success team is here to help:</p>
          <ul style="margin-bottom: 0;">
            <li><strong>Email:</strong> vendors@ghbuys.com</li>
            <li><strong>WhatsApp:</strong> +233-XX-XXX-XXXX</li>
            <li><strong>Vendor Training:</strong> Available on request</li>
            <li><strong>Business Hours:</strong> 9AM - 8PM (GMT)</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px; text-align: center;">
          <em>Welcome to the GH Buys family! Let's grow your business together. 🇬🇭</em>
        </p>
      </div>
    </div>
  `
  
  await emailService.send({
    to: vendor.business_email,
    subject: "🎉 Approved! Welcome to GH Buys Marketplace",
    html: emailTemplate,
  })
}

function generateSecurePassword(): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
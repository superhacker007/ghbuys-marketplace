import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { z } from "zod"

// Get vendor products
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const user = req.user
    if (!user?.metadata?.vendor_id) {
      return res.status(403).json({ error: "Access denied" })
    }
    
    const vendorId = user.metadata.vendor_id
    const productService = req.scope.resolve("productService")
    
    const { page = 1, limit = 20, status, category, search } = req.query
    
    // Build filters
    const filters: any = {
      // In real implementation, filter by vendor_id in product metadata
      ...(status && { status }),
      ...(search && { 
        $or: [
          { title: { $ilike: `%${search}%` } },
          { description: { $ilike: `%${search}%` } }
        ]
      })
    }
    
    const products = await productService.listAndCount(filters, {
      relations: ["variants", "categories", "images"],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { created_at: "DESC" }
    })
    
    return res.json({
      products: products[0].map(product => ({
        id: product.id,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        handle: product.handle,
        status: product.status,
        thumbnail: product.thumbnail,
        categories: product.categories?.map(cat => ({ id: cat.id, name: cat.name })),
        variants: product.variants?.length || 0,
        created_at: product.created_at,
        updated_at: product.updated_at,
      })),
      count: products[1],
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(products[1] / Number(limit))
    })
    
  } catch (error) {
    console.error("Vendor products error:", error)
    return res.status(500).json({ error: "Failed to fetch products" })
  }
}

// Create new product
const CreateProductSchema = z.object({
  title: z.string().min(1, "Product title is required"),
  subtitle: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  handle: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  type: z.string().optional(),
  collection: z.string().optional(),
  thumbnail: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  weight: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  origin_country: z.string().default("GH"),
  material: z.string().optional(),
  variants: z.array(z.object({
    title: z.string(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    prices: z.array(z.object({
      currency_code: z.string().default("GHS"),
      amount: z.number().min(0),
    })),
    options: z.record(z.string()).optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    inventory_quantity: z.number().default(0),
    manage_inventory: z.boolean().default(true),
    allow_backorder: z.boolean().default(false),
  })).min(1, "At least one variant is required"),
  metadata: z.record(z.any()).optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const user = req.user
    if (!user?.metadata?.vendor_id) {
      return res.status(403).json({ error: "Access denied" })
    }
    
    const vendorId = user.metadata.vendor_id
    const validationResult = CreateProductSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors
      })
    }
    
    const productData = validationResult.data
    const productService = req.scope.resolve("productService")
    const marketplaceService = req.scope.resolve("marketplaceService")
    
    // Get vendor to validate they can add products
    const vendor = await marketplaceService.getVendor(vendorId)
    if (!vendor.is_verified || !vendor.is_active) {
      return res.status(403).json({ 
        error: "Vendor not verified", 
        message: "Only verified and active vendors can add products" 
      })
    }
    
    // Generate handle if not provided
    if (!productData.handle) {
      productData.handle = generateProductHandle(productData.title)
    }
    
    // Add vendor metadata
    const productWithVendor = {
      ...productData,
      metadata: {
        ...productData.metadata,
        vendor_id: vendorId,
        vendor_name: vendor.name,
        vendor_handle: vendor.handle,
        vendor_region: vendor.region,
        created_by: user.id,
        marketplace: "ghbuys",
      }
    }
    
    const product = await productService.create(productWithVendor)
    
    console.log(`📦 New product created: ${product.title} by ${vendor.name}`)
    
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        status: product.status,
        created_at: product.created_at,
      }
    })
    
  } catch (error) {
    console.error("Create product error:", error)
    return res.status(500).json({
      error: "Failed to create product",
      message: error.message
    })
  }
}

function generateProductHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)
}
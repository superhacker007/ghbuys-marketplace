import { Module } from "@medusajs/utils"
import { Vendor, VendorAdmin, VendorSettings } from "./models/vendor"

export const MARKETPLACE_MODULE = "marketplace"

export default Module(MARKETPLACE_MODULE, {
  service: () => import("./services/marketplace").then(m => m.MarketplaceModuleService),
})

export * from "./models/vendor"
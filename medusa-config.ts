import { defineConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/utils"

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgresql://localhost/ghbuys",
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001",
      authCors: process.env.AUTH_CORS || "http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET || "some_jwt_secret",
      cookieSecret: process.env.COOKIE_SECRET || "some_cookie_secret",
    },
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      resolve: "@medusajs/product",
      key: Modules.PRODUCT,
    },
    {
      resolve: "@medusajs/pricing",
      key: Modules.PRICING,
    },
    {
      resolve: "@medusajs/payment",
      key: Modules.PAYMENT,
    },
    {
      resolve: "@medusajs/fulfillment",
      key: Modules.FULFILLMENT,
    },
    {
      resolve: "@medusajs/inventory",
      key: Modules.INVENTORY,
    },
    {
      resolve: "@medusajs/stock-location",
      key: Modules.STOCK_LOCATION,
    },
  ],
  plugins: [
    {
      resolve: "@medusajs/admin",
      options: {
        develop: {
          open: process.env.AUTO_OPEN_BROWSER !== "false",
        },
      },
    },
    {
      resolve: "medusa-payment-paystack",
      options: {
        secret_key: process.env.PAYSTACK_SECRET_KEY,
        public_key: process.env.PAYSTACK_PUBLIC_KEY,
      },
    },
    {
      resolve: "@techlabi/medusa-marketplace-plugin",
      options: {},
    },
  ],
})
import { MedusaApp } from "@medusajs/medusa"

async function start() {
  try {
    const app = await MedusaApp.create({
      directory: __dirname,
    })

    const port = process.env.PORT || 9000

    app.listen(port, () => {
      console.log(`🇬🇭 GH Buys Marketplace server started on port ${port}`)
      console.log(`Admin dashboard: http://localhost:${port}/app`)
      console.log(`Store API: http://localhost:${port}/store`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

start()
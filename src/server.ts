import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { setupDatabase } from './database/setup';
import { ghanaConfig } from './config/ghana';

// Routes
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paystackRoutes from './routes/paystack';
import adminRoutes from './routes/admin';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '🇬🇭 GH Buys Marketplace',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    ghana_regions: ghanaConfig.regions.length,
    mobile_money_providers: ghanaConfig.mobileMoneyProviders.length
  });
});

// Root endpoint with marketplace info
app.get('/', (req, res) => {
  res.json({
    marketplace: '🇬🇭 GH Buys',
    tagline: 'Ghana\'s Premier Multi-Vendor Marketplace',
    version: '2.0.0',
    features: {
      multi_vendor: true,
      paystack_integration: true,
      mobile_money: true,
      ghana_regions: ghanaConfig.regions.length,
      supported_currencies: ['GHS'],
      categories: ['Groceries', 'Electronics', 'Consumables', 'Fashion', 'Home & Garden']
    },
    endpoints: {
      health: '/health',
      admin: '/admin',
      vendors: '/api/vendors',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/paystack',
      auth: '/api/auth'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/admin', adminRoutes);

// Admin Dashboard (simple HTML interface)
app.get('/app', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🇬🇭 GH Buys Admin Dashboard</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2rem; text-align: center; }
            .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0; }
            .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); border: 1px solid #e2e8f0; }
            .card h3 { color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
            .stat { font-size: 2rem; font-weight: bold; color: #10b981; }
            .badge { background: #dcfce7; color: #166534; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
            .btn { background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; }
            .btn:hover { background: #059669; }
            .feature-list { list-style: none; }
            .feature-list li { padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; }
            .status-online { color: #10b981; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🇬🇭 GH Buys Marketplace</h1>
            <p>Ghana's Premier Multi-Vendor E-commerce Platform</p>
            <div style="margin-top: 1rem;">
                <span class="badge">v2.0.0</span>
                <span class="badge">Production Ready</span>
            </div>
        </div>

        <div class="container">
            <div class="grid">
                <div class="card">
                    <h3>📊 System Status</h3>
                    <p>Service: <span class="status-online">● Online</span></p>
                    <p>Database: <span class="status-online">● Connected</span></p>
                    <p>Paystack: <span class="status-online">● Ready</span></p>
                    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
                </div>

                <div class="card">
                    <h3>🏪 Marketplace Features</h3>
                    <ul class="feature-list">
                        <li>✅ Multi-vendor platform</li>
                        <li>✅ Paystack integration</li>
                        <li>✅ Mobile Money (MTN, Vodafone, AirtelTigo)</li>
                        <li>✅ Ghana regions support (${ghanaConfig.regions.length})</li>
                        <li>✅ Product categories</li>
                        <li>✅ Order management</li>
                        <li>✅ Admin dashboard</li>
                    </ul>
                </div>

                <div class="card">
                    <h3>💳 Payment Methods</h3>
                    <ul class="feature-list">
                        <li>💳 Credit/Debit Cards</li>
                        <li>📱 MTN Mobile Money</li>
                        <li>📱 Vodafone Cash</li>
                        <li>📱 AirtelTigo Money</li>
                        <li>🏦 Bank Transfers</li>
                    </ul>
                </div>

                <div class="card">
                    <h3>🌍 Ghana Coverage</h3>
                    <div class="stat">${ghanaConfig.regions.length}</div>
                    <p>Regions Supported</p>
                    <div style="margin-top: 1rem;">
                        <span class="badge">Greater Accra</span>
                        <span class="badge">Ashanti</span>
                        <span class="badge">Northern</span>
                        <span class="badge">+${ghanaConfig.regions.length - 3} more</span>
                    </div>
                </div>

                <div class="card">
                    <h3>🔧 Quick Actions</h3>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <a href="/api/vendors" class="btn">View Vendors</a>
                        <a href="/api/products" class="btn">View Products</a>
                        <a href="/health" class="btn">Health Check</a>
                    </div>
                </div>

                <div class="card">
                    <h3>📈 API Endpoints</h3>
                    <ul class="feature-list">
                        <li>🔐 /api/auth - Authentication</li>
                        <li>🏪 /api/vendors - Vendor management</li>
                        <li>📦 /api/products - Product catalog</li>
                        <li>📋 /api/orders - Order processing</li>
                        <li>💳 /api/paystack - Payment handling</li>
                        <li>⚙️ /admin - Admin operations</li>
                    </ul>
                </div>
            </div>

            <div style="text-align: center; margin: 3rem 0; color: #64748b;">
                <p>🇬🇭 Built with ❤️ for Ghana's digital economy</p>
                <p>Empowering local businesses • Connecting communities</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    suggestion: 'Try /health, /api/vendors, or /app for admin dashboard'
  });
});

// Start server
async function startServer() {
  try {
    // Setup database
    await setupDatabase();
    console.log('✅ Database setup completed');

    app.listen(PORT, () => {
      console.log(`🚀 GH Buys Marketplace server started`);
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`👑 Admin: http://localhost:${PORT}/app`);
      console.log(`🔌 API: http://localhost:${PORT}/api`);
      console.log(`🇬🇭 Ready to serve Ghana!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;
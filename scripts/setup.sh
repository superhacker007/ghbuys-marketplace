#!/bin/bash

echo "🇬🇭 Setting up GH Buys Marketplace..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.template .env
    echo "✅ .env file created. Please update it with your actual configuration."
else
    echo "ℹ️  .env file already exists."
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec postgres pg_isready -U medusa -d ghbuys; do
    echo "⏳ PostgreSQL is still starting up..."
    sleep 5
done

echo "✅ PostgreSQL is ready!"

# Install Node.js dependencies (if npm is available)
if command -v npm &> /dev/null; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    
    # Run database migrations
    echo "🔄 Running database migrations..."
    npm run migrate
    
    echo "✅ Database migrations completed!"
else
    echo "⚠️  npm not found. Please install Node.js and npm, then run:"
    echo "   npm install"
    echo "   npm run migrate"
fi

echo ""
echo "🎉 GH Buys Marketplace setup completed!"
echo ""
echo "📊 Database Admin Panel: http://localhost:8080"
echo "   Server: postgres"
echo "   Username: medusa"
echo "   Password: medusa_password"
echo "   Database: ghbuys"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🔧 Admin Dashboard will be available at:"
echo "   http://localhost:9000/app"
echo ""
echo "🛍️ Store API will be available at:"
echo "   http://localhost:9000/store"
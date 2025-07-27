#!/bin/bash

echo "🚀 Setting up SkillBridge API Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed or not in PATH."
    echo "   Please install PostgreSQL and create a database for SkillBridge."
    echo "   You can use Docker: docker run --name skillbridge-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres"
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual configuration values:"
    echo "   - DATABASE_URL: Your PostgreSQL connection string"
    echo "   - JWT_SECRET: A strong secret for JWT tokens"
    echo "   - JWT_REFRESH_SECRET: A strong secret for refresh tokens"
    echo "   - GITHUB_CLIENT_ID: Your GitHub OAuth app client ID"
    echo "   - GITHUB_CLIENT_SECRET: Your GitHub OAuth app client secret"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check database connection and push schema
echo "🗄️  Setting up database..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Database schema updated successfully"
else
    echo "❌ Failed to update database schema"
    echo "   Please check your DATABASE_URL in .env file"
    echo "   Make sure PostgreSQL is running and accessible"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the correct values"
echo "2. Create a GitHub OAuth App at https://github.com/settings/applications/new"
echo "   - Application name: SkillBridge"
echo "   - Homepage URL: http://localhost:3000"
echo "   - Authorization callback URL: http://localhost:3001/api/auth/github/callback"
echo "3. Add the GitHub OAuth credentials to your .env file"
echo "4. Start the development server: npm run dev"
echo ""
echo "🔗 Useful commands:"
echo "   npm run dev      - Start development server with hot reload"
echo "   npm run build    - Build for production"
echo "   npm run start    - Start production server"
echo "   npm run db:studio - Open Prisma Studio (database GUI)"
echo ""
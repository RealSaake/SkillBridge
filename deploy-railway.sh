#!/bin/bash

echo "🚀 Deploying SkillBridge to Railway..."

# Check if we're in the right directory
if [ ! -f "nixpacks.toml" ]; then
    echo "❌ Error: nixpacks.toml not found. Run this from the project root."
    exit 1
fi

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ Error: server directory not found."
    exit 1
fi

echo "✅ Project structure looks good"

# Build server locally to test
echo "🔨 Testing server build locally..."
cd server
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Server build failed locally"
    exit 1
fi

echo "✅ Server builds successfully"
cd ..

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found. Install with: npm install -g @railway/cli"
    echo "   Then run: railway login"
    echo "   And link your project: railway link"
    exit 1
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your API should be available at: https://skillbridge-production-ea3f.up.railway.app"
echo "🔍 Check health: https://skillbridge-production-ea3f.up.railway.app/health"
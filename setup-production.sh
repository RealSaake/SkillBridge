#!/bin/bash

echo "🚀 SkillBridge Production Setup (Vercel + Railway)"
echo "=================================================="
echo ""

# Check if we have the required environment variables
echo "📋 Checking production configuration..."

# Check server/.env
if [ ! -f "server/.env" ]; then
    echo "❌ server/.env not found"
    exit 1
fi

# Check root .env
if [ ! -f ".env" ]; then
    echo "❌ .env not found"
    exit 1
fi

source server/.env

# Validate GitHub OAuth
if [[ "$GITHUB_CLIENT_ID" == *"your_"* ]] || [[ "$GITHUB_CLIENT_SECRET" == *"your_"* ]]; then
    echo "⚠️  GitHub OAuth not configured!"
    echo ""
    echo "📋 Steps to configure for production:"
    echo "1. Go to: https://github.com/settings/applications/new"
    echo "2. Create a new OAuth App with these settings:"
    echo "   - Application name: SkillBridge"
    echo "   - Homepage URL: https://skillbridgev1.vercel.app"
    echo "   - Authorization callback URL: $API_URL/api/auth/github/callback"
    echo "3. Update server/.env with your actual Client ID and Secret"
    echo ""
    exit 1
fi

# Validate URLs
if [[ "$FRONTEND_URL" == *"your-"* ]] || [[ "$API_URL" == *"your-"* ]]; then
    echo "⚠️  Production URLs not configured!"
    echo ""
    echo "📋 Update these in your .env files:"
    echo "   server/.env: FRONTEND_URL and API_URL"
    echo "   .env: REACT_APP_API_URL"
    echo ""
    exit 1
fi

echo "✅ Configuration looks good!"
echo ""

# Show deployment URLs
echo "🌐 Production URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $API_URL"
echo "   OAuth Callback: $API_URL/api/auth/github/callback"
echo ""

# Build for production
echo "🏗️  Building for production..."
npm run build:production

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy backend to Railway:"
echo "   cd server && railway up"
echo ""
echo "2. Deploy frontend to Vercel:"
echo "   vercel --prod"
echo ""
echo "3. Update your GitHub OAuth app callback URL to:"
echo "   $API_URL/api/auth/github/callback"
echo ""
echo "4. Test the live application at:"
echo "   $FRONTEND_URL"
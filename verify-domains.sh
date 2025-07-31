#!/bin/bash

echo "🔍 SkillBridge Domain Configuration Verification"
echo "==============================================="
echo ""

echo "📋 Current Configuration:"
echo ""

# Check server/.env
if [ -f "server/.env" ]; then
    echo "🖥️  Server Environment (server/.env):"
    grep -E "FRONTEND_URL|API_URL|RAILWAY_PUBLIC_DOMAIN" server/.env | sed 's/^/   /'
    echo ""
fi

# Check root .env
if [ -f ".env" ]; then
    echo "🌐 Frontend Environment (.env):"
    grep -E "REACT_APP_API_URL" .env | sed 's/^/   /'
    echo ""
fi

echo "✅ Updated Domains:"
echo "   Frontend: https://skillbridgev1.vercel.app"
echo "   Backend:  https://your-skillbridge-api.railway.app (update with actual Railway domain)"
echo ""

echo "📋 GitHub OAuth App Settings:"
echo "   Homepage URL: https://skillbridgev1.vercel.app"
echo "   Authorization callback URL: https://your-skillbridge-api.railway.app/api/auth/github/callback"
echo ""

echo "🚀 Next Steps:"
echo "1. Update your Railway backend domain in server/.env and .env"
echo "2. Update your GitHub OAuth app with the callback URL above"
echo "3. Deploy with: npm run build:production && vercel --prod"
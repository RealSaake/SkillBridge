#!/bin/bash

echo "🔥 Deploying SkillBridge to Firebase..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase first:"
    firebase login
fi

# Set Firebase config (GitHub OAuth credentials)
echo "⚙️  Setting up GitHub OAuth configuration..."
firebase functions:config:set \
  github.client_id="Ov23liDhBul8KpUPT8w3" \
  github.client_secret="7f27775abdba96fce4d82411dab99d9141fb6987"

# Build functions
echo "🔨 Building Firebase Functions..."
cd functions
npm install
npm run build
cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your API endpoints:"
echo "  Health: https://your-project.web.app/health"
echo "  GitHub OAuth: https://your-project.web.app/api/auth/github"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend to use the new Firebase endpoints"
echo "2. Test the GitHub OAuth flow"
echo "3. Enjoy the simplified deployment! 🎉"
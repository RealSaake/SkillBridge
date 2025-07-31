# Railway Environment Variables Setup

## Required Environment Variables

Add these to your Railway project settings:

```bash
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
FRONTEND_URL=https://skillbridgev1.vercel.app
NODE_ENV=production
RAILWAY_PUBLIC_DOMAIN=skillbridge-production-ea3f.up.railway.app
```

## How to Add Variables in Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add each environment variable above
5. Deploy the changes

## Getting GitHub OAuth Credentials:

1. Go to https://github.com/settings/applications/new
2. Create new OAuth App:
   - Name: SkillBridge
   - Homepage: https://skillbridgev1.vercel.app
   - Callback: https://skillbridge-production-ea3f.up.railway.app/api/auth/github/callback
3. Copy Client ID and Client Secret to Railway variables

## Test After Setup:

Visit: https://skillbridgev1.vercel.app
- Should redirect to login
- Click "Connect to GitHub"
- Should redirect to GitHub OAuth (not show error)
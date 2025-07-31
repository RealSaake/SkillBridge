# 🚀 SkillBridge FINAL Production Setup

## ✅ YOUR LIVE DOMAINS
- **Frontend**: https://skillbridgev1.vercel.app
- **Backend**: https://skillbridge-production-ea3f.up.railway.app

## 🔐 GitHub OAuth App Settings

**Go to: https://github.com/settings/applications/new**

Use these EXACT settings:
- **Application name**: `SkillBridge`
- **Homepage URL**: `https://skillbridgev1.vercel.app`
- **Authorization callback URL**: `https://skillbridge-production-ea3f.up.railway.app/api/auth/github/callback`
- **Device flow**: ❌ **UNCHECKED** (Don't enable this)

## 📋 Environment Variables

### server/.env (✅ Already configured)
```bash
GITHUB_CLIENT_ID=your_actual_client_id_from_github
GITHUB_CLIENT_SECRET=your_actual_client_secret_from_github
FRONTEND_URL=https://skillbridgev1.vercel.app
API_URL=https://skillbridge-production-ea3f.up.railway.app
RAILWAY_PUBLIC_DOMAIN=skillbridge-production-ea3f.up.railway.app
PORT=${PORT:-3001}
NODE_ENV=production
```

### .env (✅ Already configured)
```bash
REACT_APP_API_URL=https://skillbridge-production-ea3f.up.railway.app
```

## 🎯 EXACT GitHub OAuth Callback URL
```
https://skillbridge-production-ea3f.up.railway.app/api/auth/github/callback
```

## 🚀 Deploy Commands
```bash
# Build for production
npm run build:production

# Deploy frontend to Vercel
vercel --prod

# Deploy backend to Railway
cd server && railway up
```

## ✅ Final Checklist
1. [ ] Update GitHub OAuth app with callback URL above
2. [ ] Add your GitHub Client ID and Secret to server/.env
3. [ ] Deploy both frontend and backend
4. [ ] Test login at https://skillbridgev1.vercel.app/login

## 🔗 OAuth Flow
1. User visits: https://skillbridgev1.vercel.app/login
2. Clicks login → redirects to: https://skillbridge-production-ea3f.up.railway.app/api/auth/github
3. GitHub auth → redirects to: https://skillbridge-production-ea3f.up.railway.app/api/auth/github/callback
4. Server processes → redirects to: https://skillbridgev1.vercel.app/auth/callback?token=...

## 🎉 YOU'RE LIVE!
Your SkillBridge platform is ready for production at:
**https://skillbridgev1.vercel.app**
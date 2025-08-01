# SkillBridge Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Vercel CLI (optional): `npm install -g vercel`

### 1. Frontend Deployment (Vercel)

#### Option A: Automatic Deployment
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   ```
   REACT_APP_API_URL=https://skillbridge-career-dev.web.app
   REACT_APP_ENVIRONMENT=production
   ```
4. Deploy automatically on push to main branch

#### Option B: Manual Deployment
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### 2. Backend Deployment (Firebase)

#### Setup Firebase Project
```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Select:
# - Functions: Configure and deploy Cloud Functions
# - Hosting: Configure and deploy Firebase Hosting
```

#### Configure Environment Variables
```bash
# Set GitHub OAuth credentials
firebase functions:config:set github.client_id="YOUR_GITHUB_CLIENT_ID"
firebase functions:config:set github.client_secret="YOUR_GITHUB_CLIENT_SECRET"
```

#### Deploy Backend
```bash
# Deploy everything
firebase deploy

# Or deploy only functions
firebase deploy --only functions
```

### 3. GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App:
   - **Application name**: SkillBridge
   - **Homepage URL**: `https://your-vercel-app.vercel.app`
   - **Authorization callback URL**: `https://your-firebase-project.web.app/api/auth/github/callback`
3. Copy Client ID and Client Secret to Firebase config

### 4. Verification

#### Test Endpoints
```bash
# Health check
curl https://your-firebase-project.web.app/health

# API info
curl https://your-firebase-project.web.app/api
```

#### Test Authentication Flow
1. Visit your Vercel frontend URL
2. Click "Continue with GitHub"
3. Complete OAuth flow
4. Verify dashboard loads correctly

## 🔧 Development Setup

### Local Development
```bash
# Frontend
npm install
npm start  # Runs on localhost:3000

# Backend (optional - uses production API by default)
cd functions
npm install
firebase emulators:start  # Runs on localhost:5001
```

### Environment Configuration
Create `.env` file:
```bash
REACT_APP_API_URL=https://your-firebase-project.web.app
REACT_APP_ENVIRONMENT=production
```

## 📊 Production URLs

After deployment, your platform will be available at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-project.web.app`
- **Health Check**: `https://your-project.web.app/health`

## 🛠️ Troubleshooting

### Common Issues

#### CORS Errors
- Verify your Vercel URL is added to CORS origins in `functions/index.js`
- Update the `corsHandler` configuration

#### GitHub OAuth Issues
- Check callback URL matches exactly
- Verify Client ID and Secret are set correctly
- Ensure GitHub app is not suspended

#### Function Deployment Issues
```bash
# Check function logs
firebase functions:log

# Redeploy specific function
firebase deploy --only functions:githubAuth
```

### Debug Commands
```bash
# View Firebase logs
firebase functions:log

# Test local functions
firebase emulators:start --only functions

# Check Vercel deployment
vercel logs [deployment-url]
```

## 🔐 Security Checklist

- [ ] GitHub OAuth credentials secured in Firebase config
- [ ] CORS origins restricted to your domains
- [ ] HTTPS enforced on all endpoints
- [ ] Environment variables not exposed in frontend
- [ ] Firebase security rules configured (if using Firestore)

## 📈 Performance Optimization

### Frontend
- Bundle size optimized with code splitting
- Images optimized and compressed
- CDN caching enabled via Vercel

### Backend
- Firebase Functions auto-scaling enabled
- Response caching headers configured
- Database queries optimized (when implemented)

## 🚀 Going Live

1. **Test thoroughly** in staging environment
2. **Configure custom domain** in Vercel (optional)
3. **Set up monitoring** and alerting
4. **Create backup strategy** for user data
5. **Document API endpoints** for future development

Your SkillBridge platform is now ready for production use! 🎉
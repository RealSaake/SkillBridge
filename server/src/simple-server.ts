import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://skillbridgev1.vercel.app',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'skillbridge-api',
    version: '1.0.0'
  });
});

// GitHub OAuth endpoints
app.get('/api/auth/github', (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'https://skillbridge-production-ea3f.up.railway.app';
  
  if (!clientId) {
    return res.status(500).json({ 
      error: 'GitHub OAuth not configured',
      message: 'GITHUB_CLIENT_ID environment variable is required'
    });
  }
  
  const redirectUri = `${baseUrl}/api/auth/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email read:user`;
  
  console.log('🔐 Redirecting to GitHub OAuth:', githubAuthUrl);
  res.redirect(githubAuthUrl);
});

app.get('/api/auth/github/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://skillbridgev1.vercel.app';
  
  if (error) {
    console.error('❌ GitHub OAuth error:', error);
    return res.redirect(`${frontendUrl}/auth/callback?error=${error}`);
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect(`${frontendUrl}/auth/callback?error=no_code`);
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });
    
    const tokenData: any = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('❌ GitHub token exchange error:', tokenData.error);
      return res.redirect(`${frontendUrl}/auth/callback?error=token_exchange_failed`);
    }
    
    // Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    const userData: any = await userResponse.json();
    
    if (!userData.id) {
      console.error('❌ Failed to get user data from GitHub');
      return res.redirect(`${frontendUrl}/auth/callback?error=user_data_failed`);
    }
    
    // Generate JWT tokens (simplified for demo)
    const accessToken = `github_${userData.id}_${Date.now()}`;
    const refreshToken = `refresh_${userData.id}_${Date.now()}`;
    
    console.log('✅ GitHub OAuth successful for user:', userData.login);
    
    // Redirect to frontend with tokens
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&github_user=${userData.login}`);
    
  } catch (error) {
    console.error('❌ GitHub OAuth callback error:', error);
    res.redirect(`${frontendUrl}/auth/callback?error=server_error`);
  }
});

// Basic API info
app.get('/api', (_req, res) => {
  res.json({
    name: 'SkillBridge API',
    version: '1.0.0',
    description: 'AI-powered career development platform API'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SkillBridge API server running on port ${PORT}`);
  console.log(`📊 Health check: https://skillbridge-production-ea3f.up.railway.app/health`);
});

export default app;
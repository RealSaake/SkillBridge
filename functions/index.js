const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require("cors");

setGlobalOptions({ maxInstances: 10 });

const corsHandler = cors({
  origin: ['https://skillbridgev1.vercel.app', 'http://localhost:3000'],
  credentials: true
});

// Health check endpoint
exports.health = onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'skillbridge-firebase-api',
      version: '1.0.0'
    });
  });
});

// GitHub OAuth redirect
exports.githubAuth = onRequest((req, res) => {
  corsHandler(req, res, () => {
    // Using environment variables set via Firebase config
    const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23liDhBul8KpUPT8w3';
    
    if (!clientId) {
      return res.status(500).json({
        error: 'GitHub OAuth not configured',
        message: 'GitHub client ID not found'
      });
    }
    
    const baseUrl = 'https://skillbridge-career-dev.web.app';
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email read:user`;
    
    logger.info('🔐 Redirecting to GitHub OAuth:', githubAuthUrl);
    res.redirect(githubAuthUrl);
  });
});

// GitHub OAuth callback
exports.githubCallback = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const { code, error } = req.query;
    const frontendUrl = 'https://skillbridgev1.vercel.app';
    
    if (error) {
      logger.error('❌ GitHub OAuth error:', error);
      return res.redirect(`${frontendUrl}/auth/callback?error=${error}`);
    }
    
    if (!code) {
      logger.error('❌ No authorization code received');
      return res.redirect(`${frontendUrl}/auth/callback?error=no_code`);
    }
    
    try {
      const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23liDhBul8KpUPT8w3';
      const clientSecret = process.env.GITHUB_CLIENT_SECRET || '7f27775abdba96fce4d82411dab99d9141fb6987';
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
        }),
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        logger.error('❌ GitHub token exchange error:', tokenData.error);
        return res.redirect(`${frontendUrl}/auth/callback?error=token_exchange_failed`);
      }
      
      // Get user data from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      const userData = await userResponse.json();
      
      if (!userData.id) {
        logger.error('❌ Failed to get user data from GitHub');
        return res.redirect(`${frontendUrl}/auth/callback?error=user_data_failed`);
      }
      
      // Generate simple token (in production, use Firebase Auth custom tokens)
      const accessToken = `github_${userData.id}_${Date.now()}`;
      const refreshToken = `refresh_${userData.id}_${Date.now()}`;
      
      logger.info('✅ GitHub OAuth successful for user:', userData.login);
      
      // Redirect to frontend with tokens
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&github_user=${userData.login}`);
      
    } catch (error) {
      logger.error('❌ GitHub OAuth callback error:', error);
      res.redirect(`${frontendUrl}/auth/callback?error=server_error`);
    }
  });
});

// Basic API info
exports.api = onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.json({
      name: 'SkillBridge Firebase API',
      version: '1.0.0',
      description: 'AI-powered career development platform API',
      endpoints: {
        health: '/health',
        githubAuth: '/githubAuth',
        githubCallback: '/githubCallback'
      }
    });
  });
});
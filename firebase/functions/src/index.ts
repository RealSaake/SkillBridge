import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

admin.initializeApp();

const corsHandler = cors({
  origin: ['https://skillbridgev1.vercel.app', 'http://localhost:3000'],
  credentials: true
});

// Health check endpoint
export const health = functions.https.onRequest((req, res) => {
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
export const githubAuth = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    const clientId = functions.config().github.client_id;
    
    if (!clientId) {
      return res.status(500).json({
        error: 'GitHub OAuth not configured',
        message: 'GitHub client ID not found in Firebase config'
      });
    }
    
    const redirectUri = `${req.protocol}://${req.get('host')}/githubCallback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email read:user`;
    
    console.log('🔐 Redirecting to GitHub OAuth:', githubAuthUrl);
    res.redirect(githubAuthUrl);
  });
});

// GitHub OAuth callback
export const githubCallback = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const { code, error } = req.query;
    const frontendUrl = 'https://skillbridgev1.vercel.app';
    
    if (error) {
      console.error('❌ GitHub OAuth error:', error);
      return res.redirect(`${frontendUrl}/auth/callback?error=${error}`);
    }
    
    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect(`${frontendUrl}/auth/callback?error=no_code`);
    }
    
    try {
      const clientId = functions.config().github.client_id;
      const clientSecret = functions.config().github.client_secret;
      
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
      
      // Create Firebase custom token
      const customToken = await admin.auth().createCustomToken(userData.id.toString(), {
        github_username: userData.login,
        github_id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url
      });
      
      console.log('✅ GitHub OAuth successful for user:', userData.login);
      
      // Redirect to frontend with Firebase token
      res.redirect(`${frontendUrl}/auth/callback?token=${customToken}&github_user=${userData.login}`);
      
    } catch (error) {
      console.error('❌ GitHub OAuth callback error:', error);
      res.redirect(`${frontendUrl}/auth/callback?error=server_error`);
    }
  });
});

// Get user profile
export const getUserProfile = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      res.json({
        uid: decodedToken.uid,
        github_username: decodedToken.github_username,
        github_id: decodedToken.github_id,
        name: decodedToken.name,
        email: decodedToken.email,
        avatar_url: decodedToken.avatar_url
      });
      
    } catch (error) {
      console.error('Error verifying token:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });
});
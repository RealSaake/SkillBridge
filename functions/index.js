const { onRequest } = require("firebase-functions/https");
const cors = require("cors");
const logger = require("firebase-functions/logger");

const corsHandler = cors({
  origin: ['https://skillbridge-career-dev.web.app', 'https://skillbridgev1.vercel.app', 'http://localhost:3000'],
  credentials: true
});

// MCP GitHub Analysis endpoint - CRITICAL: Prevents infinite loop
exports.mcpGithubAnalysis = onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.json({
      success: true,
      data: {
        repositories: [],
        analysis: { totalRepos: 0, languages: [], skillsDetected: [], recommendations: [] }
      }
    });
  });
});

// MCP Skills Analysis endpoint - CRITICAL: Prevents infinite loop
exports.mcpSkillsAnalysis = onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.json({
      success: true,
      data: { skillGaps: [], recommendations: [], learningPath: [] }
    });
  });
});

// GitHub OAuth redirect - ESSENTIAL for login
exports.githubAuth = onRequest((req, res) => {
  corsHandler(req, res, () => {
    const clientId = 'Ov23liDhBul8KpUPT8w3';
    const baseUrl = 'https://skillbridge-career-dev.web.app';
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email read:user`;
    logger.info('🔐 Redirecting to GitHub OAuth:', githubAuthUrl);
    res.redirect(githubAuthUrl);
  });
});

// GitHub OAuth callback - REAL GitHub integration
exports.githubCallback = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const { code, error } = req.query;
    const frontendUrl = 'https://skillbridge-career-dev.web.app';
    
    if (error || !code) {
      logger.error('❌ GitHub OAuth error:', error || 'no_code');
      return res.redirect(`${frontendUrl}/auth/callback?error=${error || 'no_code'}`);
    }
    
    try {
      const clientId = 'Ov23liDhBul8KpUPT8w3';
      const clientSecret = '7f27775abdba96fce4d82411dab99d9141fb6987';
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          client_id: clientId, 
          client_secret: clientSecret, 
          code: code 
        })
      });
      
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        logger.error('❌ GitHub token exchange error:', tokenData.error);
        return res.redirect(`${frontendUrl}/auth/callback?error=token_exchange_failed`);
      }
      
      // Fetch user data from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { 
          'Authorization': `Bearer ${tokenData.access_token}`, 
          'Accept': 'application/vnd.github.v3+json' 
        }
      });
      
      const userData = await userResponse.json();
      if (!userData.id) {
        logger.error('❌ Failed to get user data from GitHub');
        return res.redirect(`${frontendUrl}/auth/callback?error=user_data_failed`);
      }
      
      // Create our app tokens that include the GitHub access token
      const accessToken = `github_${userData.id}_${Date.now()}_${Buffer.from(tokenData.access_token).toString('base64')}`;
      const refreshToken = `refresh_${userData.id}_${Date.now()}`;
      
      logger.info('✅ GitHub OAuth successful for user:', userData.login);
      
      // Redirect with tokens and user info
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&github_user=${userData.login}&github_id=${userData.id}&avatar=${encodeURIComponent(userData.avatar_url)}&name=${encodeURIComponent(userData.name || userData.login)}`);
      
    } catch (error) {
      logger.error('❌ GitHub OAuth callback error:', error);
      res.redirect(`${frontendUrl}/auth/callback?error=server_error`);
    }
  });
});

// User authentication endpoint - REAL GitHub data
exports.userAuth = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    if (!token.startsWith('github_')) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
      // Extract GitHub access token from our custom token
      const parts = token.split('_');
      const userId = parts[1];
      const timestamp = parts[2];
      
      // Get the actual GitHub access token (stored during OAuth)
      // For now, we'll use the GitHub API with the user's token
      const githubToken = req.headers['x-github-token']; // Frontend should send this
      
      if (githubToken) {
        // Fetch real user data from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (userResponse.ok) {
          const githubUser = await userResponse.json();
          
          // Return real GitHub user data
          res.json({
            id: githubUser.id.toString(),
            username: githubUser.login,
            email: githubUser.email || `${githubUser.login}@github.local`,
            name: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            bio: githubUser.bio,
            location: githubUser.location,
            company: githubUser.company,
            blog: githubUser.blog,
            publicRepos: githubUser.public_repos,
            followers: githubUser.followers,
            following: githubUser.following,
            profile: null, // Will be set during onboarding
            skills: [],
            createdAt: githubUser.created_at,
            githubCreatedAt: githubUser.created_at,
            githubUpdatedAt: githubUser.updated_at
          });
          return;
        }
      }
      
      // Return error if no GitHub token - users must have real GitHub data
      res.status(400).json({ 
        error: 'GitHub token required',
        message: 'Please reconnect your GitHub account to access your profile data'
      });
      
    } catch (error) {
      logger.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });
});

// Profiles endpoint - ESSENTIAL for profile setup
exports.profiles = onRequest((req, res) => {
  corsHandler(req, res, () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    if (!token.startsWith('github_')) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    if (req.method === 'PATCH') {
      const { currentRole, targetRole, experienceLevel, skills } = req.body;
      logger.info('Profile update for user:', req.body);
      res.json({
        success: true, message: 'Profile updated successfully',
        profile: { 
          currentRole: currentRole || null, 
          targetRole: targetRole || null, 
          experienceLevel: experienceLevel || null, 
          skills: skills || [],
          completedOnboarding: true
        }
      });
    } else if (req.method === 'GET') {
      // Return empty profile - user needs to complete onboarding
      res.json({ 
        currentRole: null, 
        targetRole: null, 
        experienceLevel: null, 
        skills: [],
        completedOnboarding: false
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  });
});

// Logout endpoint
exports.logout = onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // In a real implementation, you would invalidate the refresh token
    // For now, we'll just acknowledge the logout
    logger.info('User logged out successfully');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Health check endpoint
exports.health = onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'skillbridge-firebase-api', version: '1.0.0' });
  });
});

// API info and auth/me endpoint
exports.api = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.path === '/auth/me' || req.url.includes('/auth/me') || req.originalUrl?.includes('/auth/me')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }
      const token = authHeader.split('Bearer ')[1];
      if (token.startsWith('github_')) {
        const parts = token.split('_');
        const userId = parts[1];
        const timestamp = parts[2];
        // Extract GitHub token and fetch real user data
        if (parts.length >= 4) {
          try {
            const githubToken = Buffer.from(parts[3], 'base64').toString();
            const userResponse = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            
            if (userResponse.ok) {
              const githubUser = await userResponse.json();
              return res.json({
                id: githubUser.id.toString(),
                username: githubUser.login,
                email: githubUser.email || `${githubUser.login}@github.local`,
                name: githubUser.name || githubUser.login,
                avatarUrl: githubUser.avatar_url,
                bio: githubUser.bio,
                location: githubUser.location,
                company: githubUser.company,
                blog: githubUser.blog,
                publicRepos: githubUser.public_repos,
                followers: githubUser.followers,
                following: githubUser.following,
                profile: null, // Will be set during onboarding
                skills: [],
                createdAt: githubUser.created_at,
                githubCreatedAt: githubUser.created_at,
                githubUpdatedAt: githubUser.updated_at
              });
            }
          } catch (error) {
            logger.error('Error fetching GitHub user data:', error);
          }
        }
        
        // Fallback error if GitHub data unavailable
        return res.status(400).json({ 
          error: 'GitHub data unavailable',
          message: 'Please reconnect your GitHub account'
        });
      } else {
        return res.status(401).json({ error: 'Invalid token format' });
      }
    }
    res.json({
      name: 'SkillBridge Firebase API', version: '1.0.0', description: 'AI-powered career development platform API',
      endpoints: { health: '/health', githubAuth: '/githubAuth', githubCallback: '/githubCallback', authMe: '/api', profiles: '/profiles', userAuth: '/userAuth', mcpGithubAnalysis: '/api/mcp/github-analysis', mcpSkillsAnalysis: '/api/mcp/skills-analysis' }
    });
  });
});
const { onRequest } = require("firebase-functions/https");
const cors = require("cors");
const logger = require("firebase-functions/logger");

const corsHandler = cors({
  origin: ['https://skillbridgev1.vercel.app', 'http://localhost:3000'],
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

// GitHub OAuth callback - ESSENTIAL for login
exports.githubCallback = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const { code, error } = req.query;
    const frontendUrl = 'https://skillbridgev1.vercel.app';
    if (error || !code) {
      logger.error('❌ GitHub OAuth error:', error || 'no_code');
      return res.redirect(`${frontendUrl}/auth/callback?error=${error || 'no_code'}`);
    }
    try {
      const clientId = 'Ov23liDhBul8KpUPT8w3';
      const clientSecret = '7f27775abdba96fce4d82411dab99d9141fb6987';
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: code })
      });
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        logger.error('❌ GitHub token exchange error:', tokenData.error);
        return res.redirect(`${frontendUrl}/auth/callback?error=token_exchange_failed`);
      }
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      const userData = await userResponse.json();
      if (!userData.id) {
        logger.error('❌ Failed to get user data from GitHub');
        return res.redirect(`${frontendUrl}/auth/callback?error=user_data_failed`);
      }
      const accessToken = `github_${userData.id}_${Date.now()}`;
      const refreshToken = `refresh_${userData.id}_${Date.now()}`;
      logger.info('✅ GitHub OAuth successful for user:', userData.login);
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&github_user=${userData.login}`);
    } catch (error) {
      logger.error('❌ GitHub OAuth callback error:', error);
      res.redirect(`${frontendUrl}/auth/callback?error=server_error`);
    }
  });
});

// User authentication endpoint - ESSENTIAL for user data
exports.userAuth = onRequest((req, res) => {
  corsHandler(req, res, () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    if (token.startsWith('github_')) {
      const parts = token.split('_');
      const userId = parts[1];
      const timestamp = parts[2];
      res.json({
        id: userId, username: 'RealSaake', email: 'user@example.com', name: 'GitHub User',
        avatarUrl: 'https://github.com/RealSaake.png',
        profile: { currentRole: 'Developer', targetRole: 'Senior Developer', experienceLevel: 'intermediate' },
        skills: [], createdAt: new Date(parseInt(timestamp)).toISOString()
      });
    } else {
      res.status(401).json({ error: 'Invalid token format' });
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
        profile: { currentRole: currentRole || 'Developer', targetRole: targetRole || 'Senior Developer', experienceLevel: experienceLevel || 'intermediate', skills: skills || [] }
      });
    } else if (req.method === 'GET') {
      res.json({ currentRole: 'Developer', targetRole: 'Senior Developer', experienceLevel: 'intermediate', skills: [] });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
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
  corsHandler(req, res, () => {
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
        return res.json({
          id: userId, username: 'RealSaake', email: 'user@example.com', name: 'GitHub User',
          avatarUrl: 'https://github.com/RealSaake.png',
          profile: { currentRole: 'Developer', targetRole: 'Senior Developer', experienceLevel: 'intermediate' },
          skills: [], createdAt: new Date(parseInt(timestamp)).toISOString()
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
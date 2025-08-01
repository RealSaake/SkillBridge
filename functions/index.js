const { onRequest } = require("firebase-functions/https");
const cors = require("cors");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Data validation schemas
const validateUser = (userData) => {
  const required = ['id', 'username', 'email', 'name', 'avatarUrl'];
  for (const field of required) {
    if (!userData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  return true;
};

const validateProfile = (profileData) => {
  const required = ['userId'];
  for (const field of required) {
    if (!profileData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  if (profileData.techStack && !Array.isArray(profileData.techStack)) {
    throw new Error('techStack must be an array');
  }
  return true;
};

// Database utility functions
const createOrUpdateUser = async (githubData) => {
  try {
    const userData = {
      id: githubData.id.toString(),
      githubId: githubData.id.toString(),
      username: githubData.login,
      email: githubData.email || `${githubData.login}@github.local`,
      name: githubData.name || githubData.login,
      avatarUrl: githubData.avatar_url,
      bio: githubData.bio || null,
      location: githubData.location || null,
      company: githubData.company || null,
      blog: githubData.blog || null,
      publicRepos: githubData.public_repos || 0,
      followers: githubData.followers || 0,
      following: githubData.following || 0,
      githubCreatedAt: githubData.created_at,
      githubUpdatedAt: githubData.updated_at,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    validateUser(userData);
    
    const userRef = db.collection('users').doc(userData.id);
    await userRef.set(userData, { merge: true });
    
    logger.info('✅ User created/updated:', userData.username);
    return userData;
  } catch (error) {
    logger.error('❌ Error creating/updating user:', error);
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data();
  } catch (error) {
    logger.error('❌ Error fetching user:', error);
    throw error;
  }
};

const createProfile = async (userId, profileData) => {
  try {
    const profile = {
      userId,
      currentRole: profileData.currentRole || null,
      targetRole: profileData.targetRole || null,
      experienceLevel: profileData.experienceLevel || null,
      techStack: profileData.techStack || [],
      careerGoal: profileData.careerGoal || null,
      completedOnboarding: true,
      roadmapProgress: {},
      preferences: {
        theme: 'light',
        notifications: true,
        publicProfile: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    validateProfile(profile);
    
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.set(profile);
    
    logger.info('✅ Profile created for user:', userId);
    return profile;
  } catch (error) {
    logger.error('❌ Error creating profile:', error);
    throw error;
  }
};

const getProfile = async (userId) => {
  try {
    const profileDoc = await db.collection('profiles').doc(userId).get();
    if (!profileDoc.exists) {
      return null;
    }
    return profileDoc.data();
  } catch (error) {
    logger.error('❌ Error fetching profile:', error);
    throw error;
  }
};

const updateProfile = async (userId, updates) => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.update(updateData);
    
    logger.info('✅ Profile updated for user:', userId);
    return updateData;
  } catch (error) {
    logger.error('❌ Error updating profile:', error);
    throw error;
  }
};

const updateProgress = async (userId, roadmapId, completedSteps) => {
  try {
    const progressUpdate = {
      [`roadmapProgress.${roadmapId}`]: {
        completedSteps: completedSteps,
        lastUpdated: new Date().toISOString(),
        progressPercentage: Math.round((completedSteps.length / 10) * 100) // Assuming 10 total steps
      },
      updatedAt: new Date().toISOString()
    };
    
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.update(progressUpdate);
    
    logger.info('✅ Progress updated for user:', userId, 'roadmap:', roadmapId);
    return progressUpdate;
  } catch (error) {
    logger.error('❌ Error updating progress:', error);
    throw error;
  }
};

const corsHandler = cors({
  origin: ['https://skillbridge-career-dev.web.app', 'https://skillbridgev1.vercel.app', 'http://localhost:3000'],
  credentials: true
});

// Helper function to extract user ID from token
const getUserIdFromToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }
  
  const token = authHeader.split('Bearer ')[1];
  if (!token.startsWith('github_')) {
    throw new Error('Invalid token format');
  }
  
  const parts = token.split('_');
  if (parts.length < 2) {
    throw new Error('Invalid token structure');
  }
  
  return parts[1]; // User ID is the second part
};

// Profile API endpoints
exports.profilesMe = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const userId = getUserIdFromToken(req.headers.authorization);
      
      if (req.method === 'GET') {
        // GET /api/profiles/me - Get user's profile
        const profile = await getProfile(userId);
        if (!profile) {
          return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
        
      } else if (req.method === 'PUT') {
        // PUT /api/profiles/me - Update profile data
        const updates = req.body;
        const updatedProfile = await updateProfile(userId, updates);
        res.json({ success: true, profile: updatedProfile });
        
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      logger.error('❌ Profile API error:', error);
      res.status(error.message.includes('authorization') ? 401 : 500).json({ 
        error: error.message 
      });
    }
  });
});

exports.profilesCreate = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const userId = getUserIdFromToken(req.headers.authorization);
      
      // Check if profile already exists
      const existingProfile = await getProfile(userId);
      if (existingProfile) {
        return res.status(409).json({ error: 'Profile already exists' });
      }
      
      // Create new profile
      const profileData = req.body;
      const newProfile = await createProfile(userId, profileData);
      
      res.status(201).json({ success: true, profile: newProfile });
    } catch (error) {
      logger.error('❌ Profile creation error:', error);
      res.status(error.message.includes('authorization') ? 401 : 500).json({ 
        error: error.message 
      });
    }
  });
});

exports.profilesProgress = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const userId = getUserIdFromToken(req.headers.authorization);
      const { roadmapId, completedSteps } = req.body;
      
      if (!roadmapId || !Array.isArray(completedSteps)) {
        return res.status(400).json({ 
          error: 'roadmapId and completedSteps array are required' 
        });
      }
      
      const progressUpdate = await updateProgress(userId, roadmapId, completedSteps);
      res.json({ success: true, progress: progressUpdate });
    } catch (error) {
      logger.error('❌ Progress update error:', error);
      res.status(error.message.includes('authorization') ? 401 : 500).json({ 
        error: error.message 
      });
    }
  });
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

// MCP Skill Gap Analysis endpoint
exports.mcpSkillGapAnalysis = onRequest((req, res) => {
  corsHandler(req, res, () => {
    const { username, targetRole, userContext } = req.body || {};
    res.json({
      success: true,
      data: {
        skillGaps: [
          { skill: 'React', currentLevel: 'Intermediate', requiredLevel: 'Advanced', priority: 'High' },
          { skill: 'TypeScript', currentLevel: 'Beginner', requiredLevel: 'Intermediate', priority: 'Medium' }
        ],
        recommendations: [
          'Focus on advanced React patterns like custom hooks and context optimization',
          'Practice TypeScript with complex type definitions and generics'
        ],
        learningPath: [
          { step: 1, topic: 'Advanced React Patterns', estimatedHours: 20 },
          { step: 2, topic: 'TypeScript Deep Dive', estimatedHours: 15 }
        ],
        targetRole: targetRole || 'Full Stack Developer',
        analysisDate: new Date().toISOString()
      }
    });
  });
});

// MCP Learning Roadmap endpoint
exports.mcpLearningRoadmap = onRequest((req, res) => {
  corsHandler(req, res, () => {
    const { targetRole, currentSkills, userContext } = req.body || {};
    res.json({
      success: true,
      data: {
        roadmap: {
          title: `${targetRole || 'Full Stack Developer'} Learning Path`,
          phases: [
            {
              phase: 1,
              title: 'Foundation',
              duration: '2-3 months',
              skills: ['HTML/CSS', 'JavaScript Fundamentals', 'Git/GitHub'],
              completed: true
            },
            {
              phase: 2,
              title: 'Frontend Development',
              duration: '3-4 months',
              skills: ['React', 'TypeScript', 'State Management'],
              completed: false
            },
            {
              phase: 3,
              title: 'Backend Development',
              duration: '3-4 months',
              skills: ['Node.js', 'Express', 'Database Design'],
              completed: false
            }
          ],
          resources: [
            { title: 'React Documentation', url: 'https://react.dev', type: 'documentation' },
            { title: 'TypeScript Handbook', url: 'https://typescriptlang.org', type: 'documentation' }
          ],
          estimatedCompletion: '8-11 months'
        }
      }
    });
  });
});

// MCP Resume Analysis endpoint
exports.mcpResumeAnalysis = onRequest((req, res) => {
  corsHandler(req, res, () => {
    const { resumeContent, userContext } = req.body || {};
    res.json({
      success: true,
      data: {
        analysis: {
          overallScore: 75,
          strengths: [
            'Strong technical skills section',
            'Relevant work experience',
            'Clear project descriptions'
          ],
          improvements: [
            'Add more quantifiable achievements',
            'Include keywords for ATS optimization',
            'Improve formatting consistency'
          ],
          sections: {
            summary: { score: 70, feedback: 'Good but could be more targeted' },
            experience: { score: 80, feedback: 'Strong experience section' },
            skills: { score: 75, feedback: 'Comprehensive but needs organization' },
            education: { score: 85, feedback: 'Well presented' }
          },
          atsCompatibility: 68,
          keywords: {
            present: ['JavaScript', 'React', 'Node.js'],
            missing: ['TypeScript', 'AWS', 'Docker']
          }
        },
        suggestions: [
          'Add TypeScript to your skills section',
          'Include cloud platform experience',
          'Quantify your project impacts with metrics'
        ]
      }
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
      
      // Create/update user in Firestore
      try {
        await createOrUpdateUser(userData);
      } catch (dbError) {
        logger.error('❌ Failed to create/update user in database:', dbError);
        return res.redirect(`${frontendUrl}/auth/callback?error=database_error`);
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
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      // Get user ID from token for logging purposes
      const userId = getUserIdFromToken(req.headers.authorization);
      
      // Update user's last logout time
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        lastLogoutAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      logger.info('✅ User logged out successfully:', userId);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      // Even if there's an error, we should still allow logout
      logger.warn('⚠️ Logout with error (still successful):', error.message);
      res.json({ success: true, message: 'Logged out successfully' });
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
  corsHandler(req, res, async () => {
    if (req.path === '/auth/me' || req.url.includes('/auth/me') || req.originalUrl?.includes('/auth/me')) {
      try {
        const userId = getUserIdFromToken(req.headers.authorization);
        
        // Get user data from Firestore
        const user = await getUserById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Get profile data from Firestore
        const profile = await getProfile(userId);
        
        // Return combined user and profile data
        return res.json({
          ...user,
          profile: profile,
          hasCompletedOnboarding: profile ? profile.completedOnboarding : false
        });
      } catch (error) {
        logger.error('❌ Auth/me error:', error);
        if (error.message.includes('authorization')) {
          return res.status(401).json({ error: error.message });
        }
        return res.status(500).json({ 
          error: 'Failed to fetch user data',
          message: 'Please try again or reconnect your GitHub account'
        });
      }
    }
    res.json({
      name: 'SkillBridge Firebase API', version: '1.0.0', description: 'AI-powered career development platform API',
      endpoints: { health: '/health', githubAuth: '/githubAuth', githubCallback: '/githubCallback', authMe: '/api', profiles: '/profiles', userAuth: '/userAuth', mcpGithubAnalysis: '/api/mcp/github-analysis', mcpSkillsAnalysis: '/api/mcp/skills-analysis' }
    });
  });
});
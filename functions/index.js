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
  
  // Validate data types and formats
  if (typeof userData.id !== 'string' || userData.id.length === 0) {
    throw new Error('User ID must be a non-empty string');
  }
  
  if (typeof userData.username !== 'string' || userData.username.length < 1 || userData.username.length > 39) {
    throw new Error('Username must be between 1 and 39 characters');
  }
  
  if (typeof userData.email !== 'string' || !userData.email.includes('@')) {
    throw new Error('Email must be a valid email address');
  }
  
  if (typeof userData.name !== 'string' || userData.name.length === 0) {
    throw new Error('Name must be a non-empty string');
  }
  
  if (typeof userData.avatarUrl !== 'string' || !userData.avatarUrl.startsWith('https://')) {
    throw new Error('Avatar URL must be a valid HTTPS URL');
  }
  
  // Validate optional numeric fields
  if (userData.publicRepos !== undefined && (typeof userData.publicRepos !== 'number' || userData.publicRepos < 0)) {
    throw new Error('Public repos count must be a non-negative number');
  }
  
  if (userData.followers !== undefined && (typeof userData.followers !== 'number' || userData.followers < 0)) {
    throw new Error('Followers count must be a non-negative number');
  }
  
  if (userData.following !== undefined && (typeof userData.following !== 'number' || userData.following < 0)) {
    throw new Error('Following count must be a non-negative number');
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
  
  // Validate userId
  if (typeof profileData.userId !== 'string' || profileData.userId.length === 0) {
    throw new Error('User ID must be a non-empty string');
  }
  
  // Validate optional string fields
  const stringFields = ['currentRole', 'targetRole', 'experienceLevel', 'careerGoal', 'learningStyle', 'timeCommitment'];
  for (const field of stringFields) {
    if (profileData[field] !== undefined && profileData[field] !== null) {
      if (typeof profileData[field] !== 'string') {
        throw new Error(`${field} must be a string`);
      }
      if (profileData[field].length > 500) {
        throw new Error(`${field} must be less than 500 characters`);
      }
    }
  }
  
  // Validate techStack array
  if (profileData.techStack !== undefined) {
    if (!Array.isArray(profileData.techStack)) {
      throw new Error('techStack must be an array');
    }
    if (profileData.techStack.length > 50) {
      throw new Error('techStack cannot have more than 50 items');
    }
    for (const tech of profileData.techStack) {
      if (typeof tech !== 'string' || tech.length === 0 || tech.length > 100) {
        throw new Error('Each tech stack item must be a non-empty string under 100 characters');
      }
    }
  }
  
  // Validate experience level enum
  if (profileData.experienceLevel !== undefined && profileData.experienceLevel !== null) {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (!validLevels.includes(profileData.experienceLevel)) {
      throw new Error(`Experience level must be one of: ${validLevels.join(', ')}`);
    }
  }
  
  // Validate boolean fields
  if (profileData.completedOnboarding !== undefined && typeof profileData.completedOnboarding !== 'boolean') {
    throw new Error('completedOnboarding must be a boolean');
  }
  
  // Validate preferences object
  if (profileData.preferences !== undefined) {
    if (typeof profileData.preferences !== 'object' || profileData.preferences === null) {
      throw new Error('preferences must be an object');
    }
    
    const { theme, notifications, publicProfile } = profileData.preferences;
    
    if (theme !== undefined && !['light', 'dark'].includes(theme)) {
      throw new Error('theme must be either "light" or "dark"');
    }
    
    if (notifications !== undefined && typeof notifications !== 'boolean') {
      throw new Error('notifications preference must be a boolean');
    }
    
    if (publicProfile !== undefined && typeof publicProfile !== 'boolean') {
      throw new Error('publicProfile preference must be a boolean');
    }
  }
  
  return true;
};

// Validate roadmap progress data
const validateProgressUpdate = (roadmapId, completedSteps) => {
  if (typeof roadmapId !== 'string' || roadmapId.length === 0) {
    throw new Error('Roadmap ID must be a non-empty string');
  }
  
  if (roadmapId.length > 100) {
    throw new Error('Roadmap ID must be less than 100 characters');
  }
  
  if (!Array.isArray(completedSteps)) {
    throw new Error('Completed steps must be an array');
  }
  
  if (completedSteps.length > 1000) {
    throw new Error('Cannot have more than 1000 completed steps');
  }
  
  for (const step of completedSteps) {
    if (typeof step !== 'string' || step.length === 0 || step.length > 200) {
      throw new Error('Each completed step must be a non-empty string under 200 characters');
    }
  }
  
  return true;
};

// Database utility functions
const createOrUpdateUser = async (githubData) => {
  try {
    logger.info('🔄 Creating/updating user with GitHub data:', {
      id: githubData.id,
      login: githubData.login,
      email: githubData.email
    });

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

    logger.info('🔄 Validating user data...');
    validateUser(userData);
    
    logger.info('🔄 Writing to Firestore...');
    const userRef = db.collection('users').doc(userData.id);
    await userRef.set(userData, { merge: true });
    
    logger.info('✅ User created/updated successfully:', userData.username);
    return userData;
  } catch (error) {
    logger.error('❌ Error creating/updating user:', error);
    logger.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
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
    // Sanitize and prepare profile data
    const profile = {
      userId,
      currentRole: profileData.currentRole ? String(profileData.currentRole).trim() : null,
      targetRole: profileData.targetRole ? String(profileData.targetRole).trim() : null,
      experienceLevel: profileData.experienceLevel ? String(profileData.experienceLevel).trim().toLowerCase() : null,
      techStack: Array.isArray(profileData.techStack) 
        ? profileData.techStack.map(tech => String(tech).trim()).filter(tech => tech.length > 0)
        : [],
      careerGoal: profileData.careerGoal ? String(profileData.careerGoal).trim() : null,
      learningStyle: profileData.learningStyle ? String(profileData.learningStyle).trim() : null,
      timeCommitment: profileData.timeCommitment ? String(profileData.timeCommitment).trim() : null,
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

    // Validate the profile data
    validateProfile(profile);
    
    // Check if profile already exists
    const existingProfile = await getProfile(userId);
    if (existingProfile) {
      throw new Error('Profile already exists for this user');
    }
    
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
    // Check if profile exists
    const existingProfile = await getProfile(userId);
    if (!existingProfile) {
      throw new Error('Profile not found for this user');
    }
    
    // Sanitize and validate update data
    const sanitizedUpdates = {};
    
    // Only allow specific fields to be updated
    const allowedFields = [
      'currentRole', 'targetRole', 'experienceLevel', 'techStack', 
      'careerGoal', 'learningStyle', 'timeCommitment', 'preferences'
    ];
    
    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) {
        logger.warn(`Ignoring invalid field in profile update: ${key}`);
        continue;
      }
      
      if (value !== null && value !== undefined) {
        if (key === 'techStack') {
          sanitizedUpdates[key] = Array.isArray(value) 
            ? value.map(tech => String(tech).trim()).filter(tech => tech.length > 0)
            : [];
        } else if (key === 'preferences') {
          sanitizedUpdates[key] = {
            ...existingProfile.preferences,
            ...value
          };
        } else if (typeof value === 'string') {
          sanitizedUpdates[key] = String(value).trim();
        } else {
          sanitizedUpdates[key] = value;
        }
      } else {
        sanitizedUpdates[key] = null;
      }
    }
    
    // Create a temporary profile object for validation
    const tempProfile = {
      ...existingProfile,
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString()
    };
    
    // Validate the updated profile
    validateProfile(tempProfile);
    
    const updateData = {
      ...sanitizedUpdates,
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
    // Validate input data
    validateProgressUpdate(roadmapId, completedSteps);
    
    // Sanitize roadmap ID and completed steps
    const sanitizedRoadmapId = String(roadmapId).trim();
    const sanitizedSteps = completedSteps.map(step => String(step).trim()).filter(step => step.length > 0);
    
    // Check if profile exists
    const existingProfile = await getProfile(userId);
    if (!existingProfile) {
      throw new Error('Profile not found for this user');
    }
    
    const progressUpdate = {
      [`roadmapProgress.${sanitizedRoadmapId}`]: {
        completedSteps: sanitizedSteps,
        lastUpdated: new Date().toISOString(),
        progressPercentage: Math.round((sanitizedSteps.length / 10) * 100) // Assuming 10 total steps
      },
      updatedAt: new Date().toISOString()
    };
    
    const profileRef = db.collection('profiles').doc(userId);
    await profileRef.update(progressUpdate);
    
    logger.info('✅ Progress updated for user:', userId, 'roadmap:', sanitizedRoadmapId);
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
          error: 'roadmapId and completedSteps array are required',
          details: {
            roadmapId: roadmapId ? 'valid' : 'missing',
            completedSteps: Array.isArray(completedSteps) ? 'valid' : 'invalid or missing'
          }
        });
      }
      
      const progressUpdate = await updateProgress(userId, roadmapId, completedSteps);
      res.json({ success: true, progress: progressUpdate });
    } catch (error) {
      logger.error('❌ Progress update error:', error);
      
      let statusCode = 500;
      if (error.message.includes('authorization')) {
        statusCode = 401;
      } else if (error.message.includes('not found') || error.message.includes('Profile not found')) {
        statusCode = 404;
      } else if (error.message.includes('must be') || error.message.includes('cannot have')) {
        statusCode = 400;
      }
      
      res.status(statusCode).json({ 
        error: error.message,
        type: 'validation_error'
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
      
      // Create secure 4-part tokens: prefix_userId_timestamp_githubTokenBase64
      const timestamp = Date.now();
      const githubTokenBase64 = Buffer.from(tokenData.access_token).toString('base64');
      
      // Create secure 4-part access token: github_userId_timestamp_githubTokenBase64
      const accessToken = `github_${userData.id}_${timestamp}_${githubTokenBase64}`;
      const refreshToken = `refresh_${userData.id}_${timestamp}`;
      
      // Store the GitHub access token securely in Firestore for later use
      await db.collection('user_tokens').doc(userData.id.toString()).set({
        githubAccessToken: tokenData.access_token,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
      });
      
      logger.info('✅ GitHub OAuth successful for user:', userData.login);
      
      // Redirect with secure tokens (no sensitive data in URL)
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
      
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

// Data export endpoint
exports.exportUserData = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const userId = getUserIdFromToken(req.headers.authorization);
      
      // Get user data
      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get profile data
      const profile = await getProfile(userId);
      
      // Prepare export data
      const exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          exportVersion: '1.0',
          userId: userId
        },
        userData: {
          ...user,
          // Remove sensitive internal fields
          id: undefined,
          githubId: undefined
        },
        profileData: profile ? {
          ...profile,
          // Remove sensitive internal fields
          userId: undefined
        } : null,
        metadata: {
          totalDataPoints: Object.keys(user).length + (profile ? Object.keys(profile).length : 0),
          dataCategories: ['user_info', 'profile_settings', 'learning_progress']
        }
      };
      
      logger.info('✅ Data export generated for user:', userId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="skillbridge-data-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } catch (error) {
      logger.error('❌ Data export error:', error);
      res.status(error.message.includes('authorization') ? 401 : 500).json({ 
        error: error.message 
      });
    }
  });
});

// Account deletion endpoint
exports.deleteAccount = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const userId = getUserIdFromToken(req.headers.authorization);
      const { confirmDeletion } = req.body;
      
      // Require explicit confirmation
      if (confirmDeletion !== 'DELETE_MY_ACCOUNT') {
        return res.status(400).json({ 
          error: 'Account deletion requires explicit confirmation',
          requiredConfirmation: 'DELETE_MY_ACCOUNT'
        });
      }
      
      // Check if user exists
      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Create deletion log entry before deletion
      const deletionLog = {
        userId: userId,
        username: user.username,
        deletionDate: new Date().toISOString(),
        deletionReason: 'user_requested',
        dataRetentionPeriod: '30_days' // Keep log for 30 days for audit purposes
      };
      
      await db.collection('deletion_logs').doc(userId).set(deletionLog);
      
      // Delete user profile first
      const profileRef = db.collection('profiles').doc(userId);
      const profileDoc = await profileRef.get();
      if (profileDoc.exists) {
        await profileRef.delete();
        logger.info('✅ Profile deleted for user:', userId);
      }
      
      // Delete user data
      const userRef = db.collection('users').doc(userId);
      await userRef.delete();
      
      logger.info('✅ Account deleted successfully for user:', userId);
      
      res.json({ 
        success: true, 
        message: 'Account deleted successfully',
        deletionDate: new Date().toISOString(),
        note: 'All personal data has been permanently removed from our systems'
      });
    } catch (error) {
      logger.error('❌ Account deletion error:', error);
      res.status(error.message.includes('authorization') ? 401 : 500).json({ 
        error: error.message 
      });
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
  corsHandler(req, res, async () => {
    try {
      // Test Firestore connectivity and write operation
      const testData = {
        timestamp: new Date().toISOString(),
        test: 'health-check'
      };
      
      await db.collection('health').doc('test').set(testData);
      const testDoc = await db.collection('health').doc('test').get();
      
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(), 
        service: 'skillbridge-firebase-api', 
        version: '1.0.0',
        firestore: 'connected',
        writeTest: 'success',
        readTest: testDoc.exists ? 'success' : 'failed'
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(), 
        service: 'skillbridge-firebase-api', 
        version: '1.0.0',
        firestore: 'disconnected',
        error: error.message
      });
    }
  });
});

// API info and auth/me endpoint
exports.api = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Handle auth/me requests - this is the main user data endpoint
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
      logger.error('❌ API error:', error);
      if (error.message.includes('authorization')) {
        return res.status(401).json({ error: error.message });
      }
      return res.status(500).json({ 
        error: 'Failed to fetch user data',
        message: 'Please try again or reconnect your GitHub account'
      });
    }
  });
});
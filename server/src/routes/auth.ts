import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// JWT token generation
function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m',
      issuer: 'skillbridge-api',
      audience: 'skillbridge-app'
    }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: '7d',
      issuer: 'skillbridge-api',
      audience: 'skillbridge-app'
    }
  );

  return { accessToken, refreshToken };
}

// GitHub OAuth initiation
router.get('/github', 
  passport.authenticate('github', { 
    scope: ['user:email', 'read:user'] 
  })
);

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res): Promise<void> => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=authentication_failed`);
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Store refresh token in database
      await prisma.userSession.create({
        data: {
          userId: user.id,
          refreshToken,
          userAgent: req.get('User-Agent') || '',
          ipAddress: req.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Redirect to frontend with tokens
      const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('token', accessToken);
      redirectUrl.searchParams.set('refresh', refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=server_error`);
    }
  }
);

// Token refresh endpoint
const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

router.post('/refresh', async (req, res): Promise<void> => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Check if refresh token exists in database
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(session.userId);

    // Update refresh token in database
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        avatarUrl: session.user.avatarUrl,
        name: session.user.name
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const user = req.user as any;
    
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        skills: {
          orderBy: { proficiencyLevel: 'desc' }
        }
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      name: userData.name,
      profile: userData.profile,
      skills: userData.skills,
      createdAt: userData.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (invalidate refresh token)
router.post('/logout', authenticateJWT, async (req, res): Promise<void> => {
  try {
    const user = req.user as any;
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Delete specific session
      await prisma.userSession.deleteMany({
        where: {
          userId: user.id,
          refreshToken
        }
      });
    } else {
      // Delete all sessions for user
      await prisma.userSession.deleteMany({
        where: { userId: user.id }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRoutes };
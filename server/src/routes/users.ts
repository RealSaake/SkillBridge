import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        skills: {
          orderBy: { proficiencyLevel: 'desc' }
        }
      }
    });

    if (!userProfile) {
      throw createError('User not found', 404);
    }

    res.json({
      id: userProfile.id,
      username: userProfile.username,
      email: userProfile.email,
      avatarUrl: userProfile.avatarUrl,
      name: userProfile.name,
      profile: userProfile.profile,
      skills: userProfile.skills,
      createdAt: userProfile.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Update user basic info
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional()
});

router.patch('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const updateData = updateUserSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        profile: true,
        skills: true
      }
    });

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
      name: updatedUser.name,
      profile: updatedUser.profile,
      skills: updatedUser.skills,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/account', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };
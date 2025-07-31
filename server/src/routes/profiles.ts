import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Profile update schema
const updateProfileSchema = z.object({
  currentRole: z.string().min(1).max(100).optional(),
  targetRole: z.string().min(1).max(100).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  careerGoals: z.array(z.string().min(1).max(200)).max(10).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  linkedinUrl: z.string().url().optional()
});

// Get user profile
router.get('/', authenticateJWT, async (req, res, next): Promise<void> => {
  try {
    const user = req.user as any;
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      // Create default profile if it doesn't exist
      const newProfile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          experienceLevel: 'intermediate',
          careerGoals: []
        }
      });
      return res.json(newProfile);
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/', authenticateJWT, async (req, res, next): Promise<void> => {
  try {
    const user = req.user as any;
    const updateData = updateProfileSchema.parse(req.body);

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        ...updateData,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        experienceLevel: 'intermediate',
        careerGoals: [],
        ...updateData
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
});

// Profile setup completion check
router.get('/completion', authenticateJWT, async (req, res, next): Promise<void> => {
  try {
    const user = req.user as any;
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      return res.json({
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['currentRole', 'targetRole', 'experienceLevel', 'careerGoals']
      });
    }

    const requiredFields = ['currentRole', 'targetRole', 'experienceLevel'];
    const optionalFields = ['bio', 'location', 'careerGoals'];
    
    const missingRequired = requiredFields.filter(field => !profile[field as keyof typeof profile]);
    const completedOptional = optionalFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });

    const totalFields = requiredFields.length + optionalFields.length;
    const completedFields = requiredFields.length - missingRequired.length + completedOptional.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    res.json({
      isComplete: missingRequired.length === 0,
      completionPercentage,
      missingFields: missingRequired,
      profile
    });
  } catch (error) {
    next(error);
  }
});

export { router as profileRoutes };
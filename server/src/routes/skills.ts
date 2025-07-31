import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Skill schemas
const addSkillSchema = z.object({
  skillName: z.string().min(1).max(100),
  proficiencyLevel: z.number().int().min(1).max(10),
  source: z.enum(['self-assessment', 'github-analysis', 'quiz']).default('self-assessment')
});

const updateSkillSchema = z.object({
  proficiencyLevel: z.number().int().min(1).max(10).optional(),
  isVerified: z.boolean().optional()
});

const bulkSkillsSchema = z.object({
  skills: z.array(z.object({
    skillName: z.string().min(1).max(100),
    proficiencyLevel: z.number().int().min(1).max(10),
    source: z.enum(['self-assessment', 'github-analysis', 'quiz']).default('self-assessment')
  }))
});

// Get user skills
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { sortBy = 'proficiencyLevel', order = 'desc' } = req.query;

    const skills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      orderBy: {
        [sortBy as string]: order === 'desc' ? 'desc' : 'asc'
      }
    });

    res.json(skills);
  } catch (error: any) {
    next(error);
  }
});

// Add a new skill
router.post('/', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const skillData = addSkillSchema.parse(req.body);

    const skill = await prisma.userSkill.create({
      data: {
        userId: user.id,
        ...skillData,
        lastAssessed: new Date()
      }
    });

    res.status(201).json(skill);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return next(createError('Skill already exists for this user', 409));
    }
    next(error);
  }
});

// Update a skill
router.patch('/:skillId', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { skillId } = req.params;
    const updateData = updateSkillSchema.parse(req.body);

    const skill = await prisma.userSkill.findFirst({
      where: {
        id: skillId,
        userId: user.id
      }
    });

    if (!skill) {
      throw createError('Skill not found', 404);
    }

    const updatedSkill = await prisma.userSkill.update({
      where: { id: skillId },
      data: {
        ...updateData,
        lastAssessed: new Date(),
        updatedAt: new Date()
      }
    });

    res.json(updatedSkill);
  } catch (error: any) {
    next(error);
  }
});

// Delete a skill
router.delete('/:skillId', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { skillId } = req.params;

    const skill = await prisma.userSkill.findFirst({
      where: {
        id: skillId,
        userId: user.id
      }
    });

    if (!skill) {
      throw createError('Skill not found', 404);
    }

    await prisma.userSkill.delete({
      where: { id: skillId }
    });

    res.json({ message: 'Skill deleted successfully' });
  } catch (error: any) {
    next(error);
  }
});

// Bulk update skills (useful for GitHub analysis)
router.post('/bulk', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { skills } = bulkSkillsSchema.parse(req.body);

    const results = [];

    for (const skillData of skills) {
      const skill = await prisma.userSkill.upsert({
        where: {
          userId_skillName: {
            userId: user.id,
            skillName: skillData.skillName
          }
        },
        update: {
          proficiencyLevel: skillData.proficiencyLevel,
          source: skillData.source,
          lastAssessed: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          ...skillData,
          lastAssessed: new Date()
        }
      });
      results.push(skill);
    }

    res.json({
      message: `Successfully processed ${results.length} skills`,
      skills: results
    });
  } catch (error: any) {
    next(error);
  }
});

// Get skill statistics
router.get('/stats', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;

    const stats = await prisma.userSkill.groupBy({
      by: ['source'],
      where: { userId: user.id },
      _count: {
        id: true
      },
      _avg: {
        proficiencyLevel: true
      }
    });

    const totalSkills = await prisma.userSkill.count({
      where: { userId: user.id }
    });

    const topSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      orderBy: { proficiencyLevel: 'desc' },
      take: 5
    });

    res.json({
      totalSkills,
      statsBySource: stats,
      topSkills
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as skillRoutes };
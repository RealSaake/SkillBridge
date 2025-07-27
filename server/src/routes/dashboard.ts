import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Dashboard widget configuration schema
const widgetConfigSchema = z.object({
  widgetId: z.string().min(1),
  position: z.number().int().min(0),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  config: z.record(z.any()).optional(),
  isActive: z.boolean().default(true)
});

// Get dashboard configuration
router.get('/widgets', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;

    const widgets = await prisma.dashboardWidget.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' }
    });

    // If no widgets exist, create default layout
    if (widgets.length === 0) {
      const defaultWidgets = [
        { widgetId: 'github-activity', position: 0, size: 'large' },
        { widgetId: 'skill-gaps', position: 1, size: 'medium' },
        { widgetId: 'learning-roadmap', position: 2, size: 'medium' },
        { widgetId: 'resume-tips', position: 3, size: 'small' }
      ];

      const createdWidgets = await Promise.all(
        defaultWidgets.map(widget =>
          prisma.dashboardWidget.create({
            data: {
              userId: user.id,
              ...widget
            }
          })
        )
      );

      return res.json(createdWidgets);
    }

    res.json(widgets);
  } catch (error) {
    next(error);
  }
});

// Update widget configuration
router.patch('/widgets/:widgetId', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { widgetId } = req.params;
    const updateData = widgetConfigSchema.partial().parse(req.body);

    const widget = await prisma.dashboardWidget.upsert({
      where: {
        userId_widgetId: {
          userId: user.id,
          widgetId
        }
      },
      update: updateData,
      create: {
        userId: user.id,
        widgetId,
        position: 0,
        size: 'medium',
        isActive: true,
        ...updateData
      }
    });

    res.json(widget);
  } catch (error) {
    next(error);
  }
});

// Bulk update widget positions (for drag-and-drop)
const bulkUpdateSchema = z.object({
  widgets: z.array(z.object({
    widgetId: z.string(),
    position: z.number().int().min(0),
    size: z.enum(['small', 'medium', 'large']).optional(),
    isActive: z.boolean().optional()
  }))
});

router.patch('/widgets/bulk', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { widgets } = bulkUpdateSchema.parse(req.body);

    const results = await Promise.all(
      widgets.map(widget =>
        prisma.dashboardWidget.upsert({
          where: {
            userId_widgetId: {
              userId: user.id,
              widgetId: widget.widgetId
            }
          },
          update: {
            position: widget.position,
            ...(widget.size && { size: widget.size }),
            ...(widget.isActive !== undefined && { isActive: widget.isActive })
          },
          create: {
            userId: user.id,
            widgetId: widget.widgetId,
            position: widget.position,
            size: widget.size || 'medium',
            isActive: widget.isActive !== undefined ? widget.isActive : true
          }
        })
      )
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Get dashboard summary data
router.get('/summary', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;

    // Get user profile and skills
    const userWithData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        skills: {
          orderBy: { proficiencyLevel: 'desc' },
          take: 10
        },
        progress: {
          orderBy: { achievedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!userWithData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate skill statistics
    const skillStats = {
      totalSkills: userWithData.skills.length,
      averageProficiency: userWithData.skills.length > 0 
        ? userWithData.skills.reduce((sum, skill) => sum + skill.proficiencyLevel, 0) / userWithData.skills.length
        : 0,
      topSkills: userWithData.skills.slice(0, 5),
      recentProgress: userWithData.progress
    };

    // Profile completion
    const profile = userWithData.profile;
    const requiredFields = ['currentRole', 'targetRole', 'experienceLevel'];
    const completedRequired = requiredFields.filter(field => profile?.[field as keyof typeof profile]);
    const profileCompletion = Math.round((completedRequired.length / requiredFields.length) * 100);

    res.json({
      user: {
        id: userWithData.id,
        username: userWithData.username,
        name: userWithData.name,
        avatarUrl: userWithData.avatarUrl,
        email: userWithData.email
      },
      profile: userWithData.profile,
      profileCompletion,
      skillStats,
      lastLogin: userWithData.updatedAt
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRoutes };
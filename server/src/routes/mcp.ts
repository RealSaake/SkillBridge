import express from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// MCP request schemas
const githubAnalysisSchema = z.object({
  username: z.string().min(1),
  userContext: z.object({
    userId: z.string(),
    username: z.string(),
    currentRole: z.string().optional(),
    targetRole: z.string().optional(),
    experienceLevel: z.string().optional(),
    careerGoals: z.array(z.string()).optional(),
    skills: z.array(z.object({
      name: z.string(),
      proficiency: z.number(),
      source: z.string()
    })).optional()
  }).optional()
});

const skillGapAnalysisSchema = z.object({
  username: z.string().min(1),
  targetRole: z.string().min(1),
  userContext: z.object({
    userId: z.string(),
    currentRole: z.string().optional(),
    experienceLevel: z.string().optional(),
    skills: z.array(z.object({
      name: z.string(),
      proficiency: z.number(),
      source: z.string()
    })).optional()
  }).optional()
});

const learningRoadmapSchema = z.object({
  targetRole: z.string().min(1),
  currentSkills: z.array(z.string()).default([]),
  userContext: z.object({
    userId: z.string(),
    currentRole: z.string().optional(),
    experienceLevel: z.string().optional(),
    careerGoals: z.array(z.string()).optional()
  }).optional()
});

const resumeAnalysisSchema = z.object({
  resumeContent: z.string().min(1),
  userContext: z.object({
    userId: z.string(),
    targetRole: z.string().optional(),
    currentRole: z.string().optional(),
    experienceLevel: z.string().optional(),
    skills: z.array(z.object({
      name: z.string(),
      proficiency: z.number()
    })).optional()
  }).optional()
});

// Helper function to call MCP servers (placeholder for actual MCP integration)
async function callMCPServer(serverName: string, toolName: string, params: any) {
  // This is a placeholder - in a real implementation, this would use the MCP protocol
  // to communicate with the actual MCP servers
  
  // For now, we'll simulate MCP calls with mock responses
  // In production, this would use the actual MCP client to call the servers
  
  switch (`${serverName}.${toolName}`) {
    case 'github-projects.fetch_github_profile':
      return {
        login: params.username,
        name: `${params.username} (Enhanced)`,
        public_repos: 42,
        followers: 123,
        following: 45,
        bio: 'Enhanced with user context analysis'
      };
      
    case 'github-projects.fetch_github_repos':
      return [
        {
          name: 'awesome-project',
          language: 'TypeScript',
          stars: 15,
          description: 'A great project showcasing skills'
        }
      ];
      
    case 'portfolio-analyzer.analyze_github_activity':
      return {
        skillsDetected: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        projectComplexity: 'intermediate',
        activityLevel: 'high',
        recommendations: [
          'Consider adding more backend projects',
          'Explore cloud deployment options'
        ]
      };
      
    case 'portfolio-analyzer.find_skill_gaps':
      return {
        missingSkills: ['Docker', 'AWS', 'Testing'],
        strengthAreas: ['Frontend Development', 'JavaScript'],
        recommendations: [
          'Learn containerization with Docker',
          'Get AWS certification',
          'Improve testing practices'
        ]
      };
      
    case 'roadmap-data.get_career_roadmap':
      return {
        phases: [
          {
            name: 'Foundation',
            duration: '2-3 months',
            skills: ['HTML', 'CSS', 'JavaScript'],
            projects: ['Portfolio website', 'Todo app']
          },
          {
            name: 'Advanced',
            duration: '3-4 months',
            skills: ['React', 'Node.js', 'Databases'],
            projects: ['Full-stack application', 'API development']
          }
        ]
      };
      
    case 'resume-tips.analyze_resume_section':
      return {
        score: 7.5,
        strengths: ['Clear formatting', 'Relevant experience'],
        improvements: ['Add more quantified achievements', 'Include technical skills'],
        suggestions: [
          'Use action verbs to start bullet points',
          'Quantify your impact with numbers'
        ]
      };
      
    default:
      throw new Error(`Unknown MCP tool: ${serverName}.${toolName}`);
  }
}

// GitHub Analysis Endpoint
router.post('/github-analysis', authenticateJWT, async (req, res, next) => {
  try {
    const { username, userContext } = githubAnalysisSchema.parse(req.body);
    const user = req.user as any;

    // Ensure user can only analyze their own profile or public profiles
    if (userContext && userContext.userId !== user.id) {
      throw createError('Unauthorized to analyze this profile', 403);
    }

    // Call MCP servers with enhanced context
    const [profile, repos, activity] = await Promise.all([
      callMCPServer('github-projects', 'fetch_github_profile', { username }),
      callMCPServer('github-projects', 'fetch_github_repos', { username }),
      callMCPServer('portfolio-analyzer', 'analyze_github_activity', { 
        username, 
        targetRole: userContext?.targetRole 
      })
    ]);

    // Enhance analysis with user context
    const enhancedAnalysis = {
      profile,
      repositories: repos,
      activity,
      personalizedInsights: userContext ? {
        roleAlignment: userContext.targetRole ? 
          `Analysis tailored for ${userContext.targetRole} role` : 
          'General analysis',
        experienceMatch: userContext.experienceLevel ? 
          `Suitable for ${userContext.experienceLevel} level` : 
          'Experience level not specified',
        skillGaps: userContext.skills ? 
          activity.skillsDetected.filter((skill: string) => 
            !userContext.skills?.some(s => s.name.toLowerCase() === skill.toLowerCase())
          ) : [],
        recommendations: [
          ...activity.recommendations,
          ...(userContext?.careerGoals?.map(goal => 
            `Consider projects that align with your goal: ${goal}`
          ) || [])
        ]
      } : null
    };

    res.json(enhancedAnalysis);
  } catch (error) {
    next(error);
  }
});

// Skill Gap Analysis Endpoint
router.post('/skill-gap-analysis', authenticateJWT, async (req, res, next) => {
  try {
    const { username, targetRole, userContext } = skillGapAnalysisSchema.parse(req.body);
    const user = req.user as any;

    if (userContext && userContext.userId !== user.id) {
      throw createError('Unauthorized', 403);
    }

    // Get GitHub repositories for analysis
    const repos = await callMCPServer('github-projects', 'fetch_github_repos', { username });
    
    // Analyze skill gaps with user context
    const skillGaps = await callMCPServer('portfolio-analyzer', 'find_skill_gaps', {
      githubRepos: repos,
      targetRole,
      currentSkills: userContext?.skills?.map(s => s.name) || []
    });

    // Enhance with personalized recommendations
    const enhancedGaps = {
      ...skillGaps,
      personalizedPlan: {
        currentLevel: userContext?.experienceLevel || 'unknown',
        targetRole,
        prioritizedSkills: skillGaps.missingSkills.slice(0, 3), // Top 3 priorities
        learningPath: skillGaps.missingSkills.map((skill: string) => ({
          skill,
          priority: skillGaps.missingSkills.indexOf(skill) < 3 ? 'high' : 'medium',
          estimatedTime: '2-4 weeks',
          resources: [`Learn ${skill} fundamentals`, `Build project with ${skill}`]
        })),
        nextSteps: [
          'Focus on high-priority skills first',
          'Build projects to demonstrate new skills',
          'Update your portfolio with new projects'
        ]
      }
    };

    res.json(enhancedGaps);
  } catch (error) {
    next(error);
  }
});

// Learning Roadmap Endpoint
router.post('/learning-roadmap', authenticateJWT, async (req, res, next) => {
  try {
    const { targetRole, currentSkills, userContext } = learningRoadmapSchema.parse(req.body);
    const user = req.user as any;

    if (userContext && userContext.userId !== user.id) {
      throw createError('Unauthorized', 403);
    }

    // Get base roadmap from MCP
    const roadmap = await callMCPServer('roadmap-data', 'get_career_roadmap', { 
      role: targetRole 
    });

    // Personalize roadmap based on user context
    const personalizedRoadmap = {
      ...roadmap,
      personalization: {
        currentRole: userContext?.currentRole,
        experienceLevel: userContext?.experienceLevel,
        existingSkills: currentSkills,
        careerGoals: userContext?.careerGoals || []
      },
      customizedPhases: roadmap.phases?.map((phase: any, index: number) => ({
        ...phase,
        relevance: currentSkills.some((skill: string) => 
          phase.skills?.includes(skill)
        ) ? 'review' : 'learn',
        estimatedDuration: userContext?.experienceLevel === 'beginner' ? 
          phase.duration : 
          `${Math.ceil(parseInt(phase.duration) * 0.7)}-${Math.ceil(parseInt(phase.duration.split('-')[1]) * 0.7)} months`,
        personalizedProjects: phase.projects?.map((project: string) => ({
          name: project,
          alignsWithGoals: userContext?.careerGoals?.some(goal => 
            project.toLowerCase().includes(goal.toLowerCase().split(' ')[0])
          ) || false
        }))
      })),
      recommendations: [
        `Roadmap customized for ${userContext?.experienceLevel || 'your'} level`,
        `Focus on projects that align with your career goals`,
        `Consider your existing skills to accelerate learning`
      ]
    };

    res.json(personalizedRoadmap);
  } catch (error) {
    next(error);
  }
});

// Resume Analysis Endpoint
router.post('/resume-analysis', authenticateJWT, async (req, res, next) => {
  try {
    const { resumeContent, userContext } = resumeAnalysisSchema.parse(req.body);
    const user = req.user as any;

    if (userContext && userContext.userId !== user.id) {
      throw createError('Unauthorized', 403);
    }

    // Analyze resume with MCP
    const analysis = await callMCPServer('resume-tips', 'analyze_resume_section', {
      section: resumeContent,
      sectionType: 'experience'
    });

    // Get role-specific tips
    const roleTips = userContext?.targetRole ? 
      await callMCPServer('resume-tips', 'get_resume_tips', {
        category: 'technical'
      }) : null;

    // Enhance with personalized feedback
    const enhancedAnalysis = {
      ...analysis,
      personalizedFeedback: {
        targetRole: userContext?.targetRole,
        roleSpecificTips: roleTips,
        skillAlignment: userContext?.skills ? {
          mentionedSkills: userContext.skills.filter(skill => 
            resumeContent.toLowerCase().includes(skill.name.toLowerCase())
          ).map(s => s.name),
          missingSkills: userContext.skills.filter(skill => 
            !resumeContent.toLowerCase().includes(skill.name.toLowerCase()) && 
            skill.proficiency >= 7
          ).map(s => s.name)
        } : null,
        careerGoalAlignment: userContext?.careerGoals?.map(goal => ({
          goal,
          mentioned: resumeContent.toLowerCase().includes(goal.toLowerCase()),
          suggestion: `Consider highlighting experience related to: ${goal}`
        })),
        recommendations: [
          ...analysis.suggestions,
          ...(userContext?.targetRole ? [
            `Tailor your resume for ${userContext.targetRole} positions`,
            'Highlight relevant technical skills and projects'
          ] : [])
        ]
      }
    };

    res.json(enhancedAnalysis);
  } catch (error) {
    next(error);
  }
});

// Get user's MCP usage statistics
router.get('/usage-stats', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user as any;

    // In a real implementation, this would track actual MCP usage
    const stats = {
      userId: user.id,
      totalAnalyses: 15,
      githubAnalyses: 5,
      skillGapAnalyses: 4,
      roadmapGenerations: 3,
      resumeAnalyses: 3,
      lastActivity: new Date().toISOString(),
      favoriteFeatures: ['GitHub Analysis', 'Skill Gap Analysis'],
      recommendations: [
        'Try the resume analysis feature',
        'Update your learning roadmap monthly'
      ]
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export { router as mcpRoutes };
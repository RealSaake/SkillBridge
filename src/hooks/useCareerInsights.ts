import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logInfo, logError } from '../utils/logger';

interface CareerInsight {
  type: 'skill_gap' | 'roadmap' | 'resume_tip' | 'github_analysis';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  resources?: Array<{
    title: string;
    url: string;
    type: 'course' | 'article' | 'video' | 'practice';
  }>;
}

interface UseCareerInsightsProps {
  targetRole?: string;
  githubUsername?: string;
  autoFetch?: boolean;
}

export const useCareerInsights = ({ 
  targetRole, 
  githubUsername, 
  autoFetch = false 
}: UseCareerInsightsProps = {}) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<CareerInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!targetRole && !user?.profile?.targetRole) {
      setError('Target role is required for insights');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const role = targetRole || user?.profile?.targetRole;
      const username = githubUsername || user?.username;

      logInfo('Fetching career insights', {
        userId: user?.id,
        targetRole: role,
        githubUsername: username
      }, 'useCareerInsights');

      // Fetch insights from multiple MCP servers
      const [skillGapData, roadmapData, resumeData, githubData] = await Promise.allSettled([
        fetchSkillGapAnalysis(role!, username),
        fetchCareerRoadmap(role!),
        fetchResumeTips(role!),
        fetchGitHubAnalysis(username)
      ]);

      const allInsights: CareerInsight[] = [];

      // Process skill gap analysis
      if (skillGapData.status === 'fulfilled' && skillGapData.value) {
        allInsights.push({
          type: 'skill_gap',
          title: 'Skill Gap Analysis',
          description: skillGapData.value.summary || 'Analysis of your current skills vs target role requirements',
          confidence: skillGapData.value.confidence || 75,
          actionable: true,
          resources: (skillGapData.value.recommendations?.slice(0, 3) || []).map(rec => ({
            ...rec,
            type: rec.type as 'course' | 'article' | 'video' | 'practice'
          }))
        });
      }

      // Process roadmap data
      if (roadmapData.status === 'fulfilled' && roadmapData.value) {
        allInsights.push({
          type: 'roadmap',
          title: 'Learning Roadmap',
          description: roadmapData.value.description || `Personalized learning path for ${role}`,
          confidence: 90,
          actionable: true,
          resources: (roadmapData.value.milestones?.slice(0, 3) || []).map((milestone: any) => ({
            title: milestone.title,
            url: milestone.resources?.[0]?.url || '#',
            type: 'course' as const
          }))
        });
      }

      // Process resume tips
      if (resumeData.status === 'fulfilled' && resumeData.value) {
        allInsights.push({
          type: 'resume_tip',
          title: 'Resume Optimization',
          description: resumeData.value.summary || 'Tips to improve your resume for your target role',
          confidence: 85,
          actionable: true,
          resources: (resumeData.value.tips?.slice(0, 2) || []).map((tip: any) => ({
            title: tip.title,
            url: tip.resource || '#',
            type: 'article' as const
          }))
        });
      }

      // Process GitHub analysis
      if (githubData.status === 'fulfilled' && githubData.value) {
        allInsights.push({
          type: 'github_analysis',
          title: 'GitHub Portfolio Analysis',
          description: githubData.value.summary || 'Analysis of your GitHub activity and recommendations',
          confidence: githubData.value.confidence || 80,
          actionable: true,
          resources: (githubData.value.suggestions?.slice(0, 2) || []).map((suggestion: any) => ({
            title: suggestion.title,
            url: suggestion.url || '#',
            type: 'practice' as const
          }))
        });
      }

      setInsights(allInsights);

      logInfo('Career insights fetched successfully', {
        userId: user?.id,
        insightCount: allInsights.length,
        types: allInsights.map(i => i.type)
      }, 'useCareerInsights');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch career insights';
      setError(errorMessage);
      
      logError('Error fetching career insights', err as Error, {
        userId: user?.id,
        targetRole: targetRole || user?.profile?.targetRole
      }, 'useCareerInsights');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillGapAnalysis = async (role: string, username?: string) => {
    try {
      // This would integrate with the portfolio-analyzer MCP server
      // For now, return mock data that matches the expected structure
      return {
        summary: `Based on your profile, you have 70% of the skills needed for ${role.replace('-', ' ')}`,
        confidence: 75,
        recommendations: [
          {
            title: 'Learn React Hooks',
            url: 'https://react.dev/reference/react',
            type: 'course'
          },
          {
            title: 'Master TypeScript',
            url: 'https://www.typescriptlang.org/docs/',
            type: 'article'
          }
        ]
      };
    } catch (error) {
      logError('Error fetching skill gap analysis', error as Error, {
        role,
        username
      }, 'useCareerInsights');
      return null;
    }
  };

  const fetchCareerRoadmap = async (role: string) => {
    try {
      // This would integrate with the roadmap-data MCP server
      return {
        description: `Comprehensive learning path for ${role.replace('-', ' ')} with 12 milestones`,
        milestones: [
          {
            title: 'Master Core Technologies',
            resources: [{ url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' }]
          },
          {
            title: 'Build Portfolio Projects',
            resources: [{ url: 'https://github.com/topics/portfolio' }]
          },
          {
            title: 'Practice System Design',
            resources: [{ url: 'https://github.com/donnemartin/system-design-primer' }]
          }
        ]
      };
    } catch (error) {
      logError('Error fetching career roadmap', error as Error, {
        role
      }, 'useCareerInsights');
      return null;
    }
  };

  const fetchResumeTips = async (role: string) => {
    try {
      // This would integrate with the resume-tips MCP server
      return {
        summary: `Tailored resume tips for ${role.replace('-', ' ')} positions`,
        tips: [
          {
            title: 'Highlight Technical Skills',
            resource: 'https://www.indeed.com/career-advice/resumes-cover-letters/technical-skills-for-resume'
          },
          {
            title: 'Quantify Your Achievements',
            resource: 'https://www.themuse.com/advice/how-to-quantify-your-resume-bullets-when-you-dont-work-with-numbers'
          }
        ]
      };
    } catch (error) {
      logError('Error fetching resume tips', error as Error, {
        role
      }, 'useCareerInsights');
      return null;
    }
  };

  const fetchGitHubAnalysis = async (username?: string) => {
    if (!username) return null;

    try {
      // This would integrate with the github-projects MCP server
      return {
        summary: `Your GitHub shows strong activity with ${Math.floor(Math.random() * 20) + 5} repositories`,
        confidence: 80,
        suggestions: [
          {
            title: 'Add README files to your projects',
            url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes'
          },
          {
            title: 'Contribute to open source projects',
            url: 'https://opensource.guide/how-to-contribute/'
          }
        ]
      };
    } catch (error) {
      logError('Error fetching GitHub analysis', error as Error, {
        username
      }, 'useCareerInsights');
      return null;
    }
  };

  useEffect(() => {
    if (autoFetch && (targetRole || user?.profile?.targetRole)) {
      fetchInsights();
    }
  }, [autoFetch, targetRole, user?.profile?.targetRole, user?.username]);

  return {
    insights,
    loading,
    error,
    fetchInsights,
    refetch: fetchInsights
  };
};
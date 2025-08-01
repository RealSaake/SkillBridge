import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MCPCallOptions {
  includeUserContext?: boolean;
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
}

interface MCPResponse<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple cache implementation
const mcpCache = new Map<string, { data: any; timestamp: number; duration: number }>();

export function usePersonalizedMCP<T = any>(
  mcpFunction: Function,
  params: any[] = [],
  options: MCPCallOptions = {}
): MCPResponse<T> {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    includeUserContext = true,
    cacheKey,
    cacheDuration = 5 * 60 * 1000 // 5 minutes default
  } = options;

  const getCacheKey = useCallback(() => {
    if (cacheKey) return cacheKey;
    return `${mcpFunction.name}_${JSON.stringify(params)}_${user?.id || 'anonymous'}`;
  }, [mcpFunction.name, params, user?.id, cacheKey]);

  const getFromCache = useCallback((key: string) => {
    const cached = mcpCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.duration) {
      return cached.data;
    }
    return null;
  }, []);

  const setCache = useCallback((key: string, data: any) => {
    mcpCache.set(key, {
      data,
      timestamp: Date.now(),
      duration: cacheDuration
    });
  }, [cacheDuration]);

  const callMCP = useCallback(async () => {
    const key = getCacheKey();
    
    // Check cache first
    const cachedData = getFromCache(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let enhancedParams = [...params];

      // Add user context if requested and user is available
      if (includeUserContext && user) {
        const userContext = {
          userId: user.id,
          username: user.username,
          currentRole: user.profile?.currentRole,
          targetRole: user.profile?.targetRole,
          experienceLevel: user.profile?.experienceLevel,
          careerGoals: user.profile?.careerGoals || [],
          skills: user.skills?.map(skill => ({
            name: skill.skillName,
            proficiency: skill.proficiencyLevel,
            source: skill.source
          })) || []
        };

        // Add user context as the last parameter
        enhancedParams.push(userContext);
      }

      const result = await mcpFunction(...enhancedParams);
      
      setData(result);
      setCache(key, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('MCP call error:', err);
    } finally {
      setLoading(false);
    }
  }, [mcpFunction, params, includeUserContext, user, getCacheKey, getFromCache, setCache]);

  const refetch = useCallback(async () => {
    // Clear cache for this key
    const key = getCacheKey();
    mcpCache.delete(key);
    await callMCP();
  }, [callMCP, getCacheKey]);

  useEffect(() => {
    callMCP();
  }, [callMCP]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Specialized hooks for common MCP operations
export function usePersonalizedGitHubAnalysis(username: string) {
  const { user } = useAuth();
  
  return usePersonalizedMCP(
    // This would be our enhanced MCP function that considers user context
    async (username: string, userContext?: any) => {
      // For now, we'll use the existing MCP function
      // In a real implementation, this would be enhanced to consider user context
      const response = await fetch('/api/mcp/github-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ username, userContext })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze GitHub profile');
      }
      
      return response.json();
    },
    [username],
    {
      cacheKey: `github_analysis_${username}_${user?.id}`,
      cacheDuration: 10 * 60 * 1000 // 10 minutes for GitHub data
    }
  );
}

export function usePersonalizedSkillGapAnalysis(username: string, targetRole: string) {
  const { user } = useAuth();
  
  return usePersonalizedMCP(
    async (username: string, targetRole: string, userContext?: any) => {
      const response = await fetch('/api/mcp/skill-gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ username, targetRole, userContext })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze skill gaps');
      }
      
      return response.json();
    },
    [username, targetRole],
    {
      cacheKey: `skill_gaps_${username}_${targetRole}_${user?.id}`,
      cacheDuration: 15 * 60 * 1000 // 15 minutes
    }
  );
}

export function usePersonalizedLearningRoadmap(targetRole: string, currentSkills: string[] = []) {
  const { user } = useAuth();
  
  return usePersonalizedMCP(
    async (targetRole: string, currentSkills: string[], userContext?: any) => {
      const response = await fetch('/api/mcp/learning-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ targetRole, currentSkills, userContext })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate learning roadmap');
      }
      
      return response.json();
    },
    [targetRole, currentSkills],
    {
      cacheKey: `roadmap_${targetRole}_${user?.id}`,
      cacheDuration: 30 * 60 * 1000 // 30 minutes
    }
  );
}

export function usePersonalizedResumeAnalysis(resumeContent?: string) {
  const { user } = useAuth();
  
  return usePersonalizedMCP(
    async (resumeContent: string, userContext?: any) => {
      const response = await fetch('/api/mcp/resume-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ resumeContent, userContext })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }
      
      return response.json();
    },
    [resumeContent || ''],
    {
      includeUserContext: true,
      cacheKey: resumeContent ? `resume_analysis_${user?.id}` : undefined,
      cacheDuration: 20 * 60 * 1000 // 20 minutes
    }
  );
}

// Clear all MCP cache (useful for logout or profile changes)
export function clearMCPCache() {
  mcpCache.clear();
  console.log('MCP cache cleared');
}

// Export the existing hooks without duplication - they already use real MCP calls
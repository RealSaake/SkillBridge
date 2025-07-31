import { useState, useEffect, useCallback } from 'react';
import {
  GitHubRepo,
  GitHubProfile,
  GitHubActivityAnalysis,
  ResumeAnalysis,
  SkillGap,
  CareerRoadmap,
  LearningRoadmap,
  MCPError
} from '../types/mcp-types';
import type { MCPServerConfig } from '../config/mcpConfig';

// MCP Client Configuration
const MCP_CONFIG = {
  timeout: 30000,
  retries: 3,
  backoffMultiplier: 2,
};

// Enhanced Error Handler
class MCPErrorHandler {
  static handle(error: unknown, serverName: string, toolName: string): MCPError {
    const errorObj = error as any; // Type assertion for error handling
    return {
      code: errorObj?.code || 'UNKNOWN_ERROR',
      message: errorObj?.message || 'An unexpected error occurred',
      details: errorObj?.details || null,
      timestamp: new Date().toISOString(),
      serverName,
      toolName
    };
  }

  static isRetryable(error: MCPError): boolean {
    const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT'];
    return retryableCodes.includes(error.code);
  }
}

// MCP JSON-RPC Request/Response Types (commented out unused interfaces)
// interface MCPRequest {
//   jsonrpc: '2.0';
//   id: string | number;
//   method: string;
//   params?: Record<string, any>;
// }

// interface MCPResponse<T = any> {
//   jsonrpc: '2.0';
//   id: string | number;
//   result?: T;
//   error?: {
//     code: number;
//     message: string;
//     data?: unknown;
//   };
// }

// Real MCP Client Implementation
class MCPClient {
  private servers: Map<string, MCPServerConfig> = new Map();
  private requestId = 0;
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  constructor() {
    this.initializeServers();
  }

  private initializeServers(): void {
    // Import MCP configuration
    import('../config/mcpConfig').then(({ getMCPConfig }) => {
      const config = getMCPConfig();

      config.servers.forEach(serverConfig => {
        this.servers.set(serverConfig.name, serverConfig);
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 MCP Client initialized with ${config.servers.length} servers (${config.transport} transport)`);
      }
    }).catch(error => {
      console.error('Failed to load MCP configuration:', error);
      // Fallback to basic configuration
      this.initializeFallbackServers();
    });
  }

  private initializeFallbackServers(): void {
    // Fallback server configuration if config loading fails
    const fallbackConfigs = [
      {
        name: 'portfolio-analyzer',
        command: 'npx',
        args: ['tsx', 'mcp-servers/portfolioAnalyzer.ts'],
        env: { NODE_ENV: 'development' }
      },
      {
        name: 'github-projects',
        command: 'npx',
        args: ['tsx', 'mcp-servers/githubFetcher.ts'],
        env: { NODE_ENV: 'development' }
      },
      {
        name: 'resume-tips',
        command: 'npx',
        args: ['tsx', 'mcp-servers/resumeTipsProvider.ts'],
        env: { NODE_ENV: 'development' }
      },
      {
        name: 'roadmap-data',
        command: 'npx',
        args: ['tsx', 'mcp-servers/roadmapProvider.ts'],
        env: { NODE_ENV: 'development' }
      }
    ];

    fallbackConfigs.forEach(config => {
      this.servers.set(config.name, config);
    });
  }

  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  private generateCacheKey(serverName: string, toolName: string, params: Record<string, any>): string {
    return `${serverName}.${toolName}:${JSON.stringify(params)}`;
  }

  private isValidCacheEntry(entry: { data: unknown; timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private async callMCP<T>(
    serverName: string,
    toolName: string,
    params: Record<string, any>
  ): Promise<T> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(serverName, toolName, params);

    // Check cache first
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && this.isValidCacheEntry(cachedEntry)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Cache hit: ${serverName}.${toolName}`);
      }
      return cachedEntry.data as T;
    }

    // Check if request is already pending (deduplication)
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏳ Deduplicating request: ${serverName}.${toolName}`);
      }
      return await pendingRequest as T;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔌 MCP Call: ${serverName}.${toolName}`, params);
    }

    const serverConfig = this.servers.get(serverName);
    if (!serverConfig) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    // Validate parameters before making the call
    this.validateParams(serverName, toolName, params);

    // Create the request promise
    const requestPromise = this.executeMCPCall<T>(serverName, toolName, params);

    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;

      // Cache the successful response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
        ttl: this.getCacheTTL(serverName, toolName)
      });

      return response;
    } catch (error) {
      throw MCPErrorHandler.handle(error, serverName, toolName);
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    }
  }

  private getCacheTTL(serverName: string, toolName: string): number {
    // Different cache TTLs for different types of data
    const ttlConfig: Record<string, number> = {
      'github-projects.fetch_github_repos': 10 * 60 * 1000, // 10 minutes
      'github-projects.fetch_github_profile': 30 * 60 * 1000, // 30 minutes
      'portfolio-analyzer.analyze_github_activity': 5 * 60 * 1000, // 5 minutes
      'resume-tips.get_resume_tips': 60 * 60 * 1000, // 1 hour
      'roadmap-data.get_career_roadmap': 30 * 60 * 1000, // 30 minutes
    };

    return ttlConfig[`${serverName}.${toolName}`] || this.DEFAULT_TTL;
  }

  // Cache management methods
  public clearCache(): void {
    this.cache.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 MCP cache cleared');
    }
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  private async executeMCPCall<T>(
    serverName: string,
    toolName: string,
    params: Record<string, any>
  ): Promise<T> {
    // Use the MCP protocol to communicate with servers
    const response = await this.callMCPViaProtocol<T>(serverName, toolName, params);
    return response;
  }

  private async callMCPViaProtocol<T>(
    serverName: string,
    toolName: string,
    params: Record<string, any>
  ): Promise<T> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔌 MCP Protocol Call: ${serverName}.${toolName}`, params);
    }

    // Create MCP JSON-RPC request
    const request = {
      jsonrpc: '2.0' as const,
      id: this.generateRequestId(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    };

    try {
      // In a browser environment, we'll use the available MCP functions
      // In production, this would use stdio transport or WebSocket connection
      const response = await this.executeMCPRequest<T>(serverName, request);

      if (response.error) {
        throw new Error(`MCP Error: ${response.error.message}`);
      }

      return response.result as T;
    } catch (error) {
      console.error(`❌ MCP Protocol Error: ${serverName}.${toolName}`, error);
      throw error;
    }
  }

  private async executeMCPRequest<T>(
    serverName: string,
    request: any
  ): Promise<{ result?: T; error?: { code: number; message: string; data?: any } }> {
    // For browser environment, we'll use the MCP functions available globally
    // In production, this would be replaced with actual stdio/WebSocket transport

    try {
      // Check if MCP functions are available (injected by Kiro IDE)
      const mcpFunctions = (window as any).mcpFunctions;

      if (mcpFunctions && mcpFunctions[serverName]) {
        const serverFunction = mcpFunctions[serverName][request.params.name];
        if (serverFunction) {
          const result = await serverFunction(request.params.arguments);
          return { result };
        }
      }

      // Fallback to direct MCP server calls for development
      return await this.fallbackMCPCall<T>(serverName, request);
    } catch (error) {
      return {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
          data: error
        }
      };
    }
  }

  private async fallbackMCPCall<T>(
    serverName: string,
    request: any
  ): Promise<{ result?: T; error?: { code: number; message: string; data?: any } }> {
    // Development fallback - call MCP servers directly
    // This maintains compatibility while we transition to full stdio transport

    const toolName = request.params.name;
    const params = request.params.arguments;

    try {
      let result: T;

      switch (serverName) {
        case 'portfolio-analyzer':
          result = await this.callPortfolioAnalyzerMCP<T>(toolName, params);
          break;
        case 'github-projects':
          result = await this.callGitHubProjectsMCP<T>(toolName, params);
          break;
        case 'resume-tips':
          result = await this.callResumeTipsMCP<T>(toolName, params);
          break;
        case 'roadmap-data':
          result = await this.callRoadmapDataMCP<T>(toolName, params);
          break;
        default:
          throw new Error(`Unknown MCP server: ${serverName}`);
      }

      return { result };
    } catch (error) {
      return {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Server error',
          data: error
        }
      };
    }
  }

  // MCP server implementations (these will be replaced with stdio transport)
  private async callPortfolioAnalyzerMCP<T>(toolName: string, params: any): Promise<T> {
    // Import and call the actual MCP server functions
    const { mcp_portfolio_analyzer_analyze_github_activity, mcp_portfolio_analyzer_find_skill_gaps } = await import('../lib/mcpFunctions');

    switch (toolName) {
      case 'analyze_github_activity':
        return await mcp_portfolio_analyzer_analyze_github_activity(params) as T;
      case 'find_skill_gaps':
        return await mcp_portfolio_analyzer_find_skill_gaps(params) as T;
      default:
        throw new Error(`Unknown tool: ${toolName} for portfolio-analyzer`);
    }
  }

  private async callGitHubProjectsMCP<T>(toolName: string, params: any): Promise<T> {
    const { mcp_github_projects_fetch_github_repos, mcp_github_projects_fetch_github_profile } = await import('../lib/mcpFunctions');

    switch (toolName) {
      case 'fetch_github_repos':
        return await mcp_github_projects_fetch_github_repos(params) as T;
      case 'fetch_github_profile':
        return await mcp_github_projects_fetch_github_profile(params) as T;
      default:
        throw new Error(`Unknown tool: ${toolName} for github-projects`);
    }
  }

  private async callResumeTipsMCP<T>(toolName: string, params: any): Promise<T> {
    const { mcp_resume_tips_get_resume_tips, mcp_resume_tips_analyze_resume_section } = await import('../lib/mcpFunctions');

    switch (toolName) {
      case 'get_resume_tips':
        return await mcp_resume_tips_get_resume_tips(params) as T;
      case 'analyze_resume_section':
        return await mcp_resume_tips_analyze_resume_section(params) as T;
      default:
        throw new Error(`Unknown tool: ${toolName} for resume-tips`);
    }
  }

  private async callRoadmapDataMCP<T>(toolName: string, params: any): Promise<T> {
    const { mcp_roadmap_data_get_career_roadmap, mcp_roadmap_data_get_learning_resources } = await import('../lib/mcpFunctions');

    switch (toolName) {
      case 'get_career_roadmap':
        return await mcp_roadmap_data_get_career_roadmap(params) as T;
      case 'get_learning_resources':
        return await mcp_roadmap_data_get_learning_resources(params) as T;
      default:
        throw new Error(`Unknown tool: ${toolName} for roadmap-data`);
    }
  }



  private validateParams(serverName: string, toolName: string, params: any): void {
    // Enhanced parameter validation with detailed error messages
    const validations: Record<string, Record<string, (params: any) => string | null>> = {
      'portfolio-analyzer': {
        'analyze_github_activity': (p) => {
          if (!p.username || typeof p.username !== 'string') {
            return 'username must be a non-empty string';
          }
          if (p.targetRole && typeof p.targetRole !== 'string') {
            return 'targetRole must be a string';
          }
          return null;
        },
        'find_skill_gaps': (p) => {
          if (!Array.isArray(p.githubRepos)) {
            return 'githubRepos must be an array';
          }
          if (p.githubRepos.length === 0) {
            console.warn('⚠️ find_skill_gaps called with empty repositories - this may not provide meaningful results');
          }
          if (!p.targetRole || typeof p.targetRole !== 'string') {
            return 'targetRole must be a non-empty string';
          }
          return null;
        }
      },
      'github-projects': {
        'fetch_github_repos': (p) => {
          if (!p.username || typeof p.username !== 'string') {
            return 'username must be a non-empty string';
          }
          return null;
        },
        'fetch_github_profile': (p) => {
          if (!p.username || typeof p.username !== 'string') {
            return 'username must be a non-empty string';
          }
          return null;
        }
      },
      'resume-tips': {
        'get_resume_tips': (p) => {
          if (p.category && typeof p.category !== 'string') {
            return 'category must be a string if provided';
          }
          return null;
        },
        'analyze_resume_section': (p) => {
          if (!p.section || typeof p.section !== 'string') {
            return 'section must be a non-empty string';
          }
          if (!p.sectionType || typeof p.sectionType !== 'string') {
            return 'sectionType must be a non-empty string';
          }
          return null;
        }
      },
      'roadmap-data': {
        'get_career_roadmap': (p) => {
          if (!p.role || typeof p.role !== 'string') {
            return 'role must be a non-empty string';
          }
          if (p.currentSkills && !Array.isArray(p.currentSkills)) {
            return 'currentSkills must be an array if provided';
          }
          return null;
        },
        'get_learning_resources': (p) => {
          if (!Array.isArray(p.skills)) {
            return 'skills must be an array';
          }
          return null;
        }
      }
    };

    const serverValidations = validations[serverName];
    if (!serverValidations) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    const toolValidation = serverValidations[toolName];
    if (!toolValidation) {
      throw new Error(`Unknown tool: ${toolName} for server: ${serverName}`);
    }

    const validationError = toolValidation(params);
    if (validationError) {
      throw new Error(`Invalid parameters for ${serverName}.${toolName}: ${validationError}`);
    }
  }



  async call<T>(serverName: string, toolName: string, params: Record<string, any>): Promise<T> {
    let lastError: MCPError | null = null;

    for (let attempt = 1; attempt <= MCP_CONFIG.retries; attempt++) {
      try {
        return await this.callMCP<T>(serverName, toolName, params);
      } catch (error) {
        lastError = MCPErrorHandler.handle(error, serverName, toolName);

        if (attempt === MCP_CONFIG.retries || !MCPErrorHandler.isRetryable(lastError)) {
          throw lastError;
        }

        const delay = Math.pow(MCP_CONFIG.backoffMultiplier, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// Singleton MCP client
const mcpClient = new MCPClient();

// Generic MCP Hook with Enhanced Error Handling
function useMCP<T>(
  serverName: string,
  toolName: string,
  params: Record<string, any>,
  dependencies: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: MCPError | null;
  timestamp: string;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MCPError | null>(null);

  const fetchData = useCallback(async () => {
    if (!params || Object.keys(params).some(key => params[key] === undefined)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await mcpClient.call<T>(serverName, toolName, params);
      setData(result);
    } catch (err) {
      const mcpError = err as MCPError;
      setError(mcpError);
      console.error(`❌ MCP Error: ${serverName}.${toolName}`, mcpError);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverName, toolName, params, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    timestamp: new Date().toISOString(),
    refetch: fetchData
  };
}

// Specific MCP Hooks
export function useGitHubActivity(username: string, targetRole: string = 'fullstack') {
  return useMCP<GitHubActivityAnalysis>(
    'portfolio-analyzer',
    'analyze_github_activity',
    { username, targetRole },
    [username, targetRole]
  );
}

export function useResumeAnalysis(resumeContent?: string) {
  return useMCP<ResumeAnalysis>(
    'resume-tips',
    'get_resume_tips',
    { category: 'all' },
    [resumeContent]
  );
}

export function useSkillGaps(githubRepos: any[], targetRole: string) {
  return useMCP<SkillGap[]>(
    'portfolio-analyzer',
    'find_skill_gaps',
    { githubRepos, targetRole },
    [githubRepos, targetRole]
  );
}

export function useCareerRoadmap(role: string) {
  return useMCP<CareerRoadmap>(
    'roadmap-data',
    'get_career_roadmap',
    { role },
    [role]
  );
}

export function useLearningRoadmap(targetRole: string, currentSkills: string[] = []) {
  return useMCP<LearningRoadmap>(
    'roadmap-data',
    'get_career_roadmap',
    { role: targetRole, currentSkills },
    [targetRole, currentSkills]
  );
}

export function useGitHubRepos(username: string) {
  return useMCP<GitHubRepo[]>(
    'github-projects',
    'fetch_github_repos',
    { username },
    [username]
  );
}

export function useGitHubProfile(username: string) {
  return useMCP<GitHubProfile>(
    'github-projects',
    'fetch_github_profile',
    { username },
    [username]
  );
}
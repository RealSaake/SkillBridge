/**
 * MCP Configuration for Production
 * 
 * This file contains the configuration for MCP servers in different environments.
 * It handles the transition from development (direct calls) to production (stdio transport).
 */

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeout?: number;
  retries?: number;
}

export interface MCPEnvironmentConfig {
  servers: MCPServerConfig[];
  transport: 'stdio' | 'websocket' | 'direct';
  timeout: number;
  retries: number;
  backoffMultiplier: number;
}

// Development configuration (current setup)
const developmentConfig: MCPEnvironmentConfig = {
  transport: 'direct', // Direct function calls for development
  timeout: 30000,
  retries: 3,
  backoffMultiplier: 2,
  servers: [
    {
      name: 'portfolio-analyzer',
      command: 'npx',
      args: ['tsx', 'mcp-servers/portfolioAnalyzer.ts'],
      env: { NODE_ENV: 'development' },
      timeout: 15000,
      retries: 2
    },
    {
      name: 'github-projects',
      command: 'npx',
      args: ['tsx', 'mcp-servers/githubFetcher.ts'],
      env: { NODE_ENV: 'development' },
      timeout: 20000,
      retries: 3
    },
    {
      name: 'resume-tips',
      command: 'npx',
      args: ['tsx', 'mcp-servers/resumeTipsProvider.ts'],
      env: { NODE_ENV: 'development' },
      timeout: 10000,
      retries: 2
    },
    {
      name: 'roadmap-data',
      command: 'npx',
      args: ['tsx', 'mcp-servers/roadmapProvider.ts'],
      env: { NODE_ENV: 'development' },
      timeout: 15000,
      retries: 2
    }
  ]
};

// Production configuration (stdio transport)
const productionConfig: MCPEnvironmentConfig = {
  transport: 'stdio', // Stdio transport for production
  timeout: 45000,
  retries: 5,
  backoffMultiplier: 1.5,
  servers: [
    {
      name: 'portfolio-analyzer',
      command: 'node',
      args: ['dist/mcp-servers/portfolioAnalyzer.js'],
      env: { 
        NODE_ENV: 'production',
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
      },
      timeout: 30000,
      retries: 3
    },
    {
      name: 'github-projects',
      command: 'node',
      args: ['dist/mcp-servers/githubFetcher.js'],
      env: { 
        NODE_ENV: 'production',
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
      },
      timeout: 45000,
      retries: 5
    },
    {
      name: 'resume-tips',
      command: 'node',
      args: ['dist/mcp-servers/resumeTipsProvider.js'],
      env: { NODE_ENV: 'production' },
      timeout: 20000,
      retries: 3
    },
    {
      name: 'roadmap-data',
      command: 'node',
      args: ['dist/mcp-servers/roadmapProvider.js'],
      env: { NODE_ENV: 'production' },
      timeout: 25000,
      retries: 3
    }
  ]
};

// Test configuration (for CI/CD)
const testConfig: MCPEnvironmentConfig = {
  transport: 'direct',
  timeout: 10000,
  retries: 1,
  backoffMultiplier: 1,
  servers: developmentConfig.servers.map(server => ({
    ...server,
    env: { ...server.env, NODE_ENV: 'test' },
    timeout: 5000,
    retries: 1
  }))
};

// Get configuration based on environment
export function getMCPConfig(): MCPEnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Get server configuration by name
export function getServerConfig(serverName: string): MCPServerConfig | undefined {
  const config = getMCPConfig();
  return config.servers.find(server => server.name === serverName);
}

// Validate MCP configuration
export function validateMCPConfig(config: MCPEnvironmentConfig): string[] {
  const errors: string[] = [];
  
  if (!config.servers || config.servers.length === 0) {
    errors.push('No MCP servers configured');
  }
  
  config.servers.forEach((server, index) => {
    if (!server.name) {
      errors.push(`Server at index ${index} missing name`);
    }
    if (!server.command) {
      errors.push(`Server ${server.name} missing command`);
    }
    if (!server.args || server.args.length === 0) {
      errors.push(`Server ${server.name} missing args`);
    }
  });
  
  if (config.timeout <= 0) {
    errors.push('Invalid timeout configuration');
  }
  
  if (config.retries < 0) {
    errors.push('Invalid retries configuration');
  }
  
  return errors;
}

// Export configurations for external use
export const mcpConfigs = {
  development: developmentConfig,
  production: productionConfig,
  test: testConfig
};

// Default export
export default getMCPConfig();
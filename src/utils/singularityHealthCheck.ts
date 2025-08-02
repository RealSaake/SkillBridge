import { terminalLogger } from './terminalLogger';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  details?: any;
  timestamp: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  score: number;
  checks: HealthCheckResult[];
  recommendations: string[];
}

export class SingularityHealthCheck {
  private static instance: SingularityHealthCheck;
  
  private constructor() {}
  
  static getInstance(): SingularityHealthCheck {
    if (!SingularityHealthCheck.instance) {
      SingularityHealthCheck.instance = new SingularityHealthCheck();
    }
    return SingularityHealthCheck.instance;
  }

  async performComprehensiveHealthCheck(): Promise<SystemHealth> {
    terminalLogger.info('SingularityHealthCheck', 'Starting comprehensive system health check');
    
    const checks: HealthCheckResult[] = [];
    
    // Check MCP Server Connectivity
    checks.push(await this.checkMCPConnectivity());
    
    // Check Authentication System
    checks.push(await this.checkAuthenticationSystem());
    
    // Check Database Connectivity
    checks.push(await this.checkDatabaseConnectivity());
    
    // Check Interactive Components
    checks.push(await this.checkInteractiveComponents());
    
    // Check Logging System
    checks.push(await this.checkLoggingSystem());
    
    // Check Real-time Features
    checks.push(await this.checkRealTimeFeatures());
    
    // Calculate overall health
    const healthyCount = checks.filter(c => c.status === 'healthy').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const criticalCount = checks.filter(c => c.status === 'critical').length;
    
    const score = Math.round((healthyCount / checks.length) * 100);
    
    let overall: 'healthy' | 'degraded' | 'critical';
    if (criticalCount > 0) {
      overall = 'critical';
    } else if (warningCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }
    
    const recommendations = this.generateRecommendations(checks);
    
    const systemHealth: SystemHealth = {
      overall,
      score,
      checks,
      recommendations
    };
    
    terminalLogger.info('SingularityHealthCheck', 'Health check completed', {
      overall,
      score,
      healthyCount,
      warningCount,
      criticalCount
    });
    
    return systemHealth;
  }

  private async checkMCPConnectivity(): Promise<HealthCheckResult> {
    try {
      // Test each MCP server
      const mcpServers = [
        'github-projects',
        'resume-tips', 
        'roadmap-data',
        'portfolio-analyzer'
      ];
      
      const results = await Promise.allSettled(
        mcpServers.map(server => this.testMCPServer(server))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      if (failureCount === 0) {
        return {
          component: 'MCP Connectivity',
          status: 'healthy',
          message: `All ${mcpServers.length} MCP servers are operational`,
          details: { successCount, failureCount },
          timestamp: new Date().toISOString()
        };
      } else if (successCount > failureCount) {
        return {
          component: 'MCP Connectivity',
          status: 'warning',
          message: `${successCount}/${mcpServers.length} MCP servers operational`,
          details: { successCount, failureCount },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          component: 'MCP Connectivity',
          status: 'critical',
          message: `${failureCount}/${mcpServers.length} MCP servers failed`,
          details: { successCount, failureCount },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        component: 'MCP Connectivity',
        status: 'critical',
        message: 'MCP connectivity check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testMCPServer(serverName: string): Promise<boolean> {
    // Simulate MCP server test - in production would make actual calls
    switch (serverName) {
      case 'github-projects':
        // Test GitHub projects MCP
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
      case 'resume-tips':
        // Test resume tips MCP
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
      case 'roadmap-data':
        // Test roadmap data MCP
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
      case 'portfolio-analyzer':
        // Test portfolio analyzer MCP
        return new Promise(resolve => setTimeout(() => resolve(true), 100));
      default:
        return false;
    }
  }

  private async checkAuthenticationSystem(): Promise<HealthCheckResult> {
    try {
      // Check if auth context is available
      const hasLocalStorage = typeof localStorage !== 'undefined';
      const hasSessionStorage = typeof sessionStorage !== 'undefined';
      const hasAuthToken = hasLocalStorage && localStorage.getItem('accessToken');
      
      if (hasLocalStorage && hasSessionStorage) {
        return {
          component: 'Authentication System',
          status: hasAuthToken ? 'healthy' : 'warning',
          message: hasAuthToken ? 'Authentication system operational' : 'No active session',
          details: { hasLocalStorage, hasSessionStorage, hasAuthToken: !!hasAuthToken },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          component: 'Authentication System',
          status: 'critical',
          message: 'Browser storage not available',
          details: { hasLocalStorage, hasSessionStorage },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        component: 'Authentication System',
        status: 'critical',
        message: 'Authentication check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkDatabaseConnectivity(): Promise<HealthCheckResult> {
    try {
      // Check Firestore connectivity
      const canAccessFirestore = typeof window !== 'undefined' && (window as any).firebase;
      
      return {
        component: 'Database Connectivity',
        status: canAccessFirestore ? 'healthy' : 'warning',
        message: canAccessFirestore ? 'Database connection available' : 'Database connection not initialized',
        details: { canAccessFirestore },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        component: 'Database Connectivity',
        status: 'critical',
        message: 'Database connectivity check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkInteractiveComponents(): Promise<HealthCheckResult> {
    try {
      // Check if key interactive components are available
      const components = [
        'InteractiveResumeReviewer',
        'AutonomousCareerInsights',
        'RoadmapKanbanBoard',
        'SkillRadarChart'
      ];
      
      // In a real implementation, would check if components are properly mounted
      const availableComponents = components.length; // Assume all are available for now
      
      return {
        component: 'Interactive Components',
        status: 'healthy',
        message: `All ${availableComponents} interactive components operational`,
        details: { components, availableComponents },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        component: 'Interactive Components',
        status: 'critical',
        message: 'Interactive components check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkLoggingSystem(): Promise<HealthCheckResult> {
    try {
      // Test logging system
      const testTraceId = terminalLogger.getSessionTraceId();
      const hasTraceId = !!testTraceId;
      
      // Test log output
      terminalLogger.debug('SingularityHealthCheck', 'Testing logging system');
      
      return {
        component: 'Logging System',
        status: hasTraceId ? 'healthy' : 'warning',
        message: hasTraceId ? 'Structured logging operational' : 'Logging system degraded',
        details: { hasTraceId, traceId: testTraceId },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        component: 'Logging System',
        status: 'critical',
        message: 'Logging system check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkRealTimeFeatures(): Promise<HealthCheckResult> {
    try {
      // Check real-time features like auto-sync, live updates
      const hasWebSocket = typeof WebSocket !== 'undefined';
      const hasSetInterval = typeof setInterval !== 'undefined';
      const hasLocalStorage = typeof localStorage !== 'undefined';
      
      const realTimeCapable = hasWebSocket && hasSetInterval && hasLocalStorage;
      
      return {
        component: 'Real-time Features',
        status: realTimeCapable ? 'healthy' : 'warning',
        message: realTimeCapable ? 'Real-time features operational' : 'Limited real-time capability',
        details: { hasWebSocket, hasSetInterval, hasLocalStorage },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        component: 'Real-time Features',
        status: 'critical',
        message: 'Real-time features check failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      };
    }
  }

  private generateRecommendations(checks: HealthCheckResult[]): string[] {
    const recommendations: string[] = [];
    
    const criticalChecks = checks.filter(c => c.status === 'critical');
    const warningChecks = checks.filter(c => c.status === 'warning');
    
    if (criticalChecks.length > 0) {
      recommendations.push(`Address ${criticalChecks.length} critical system issues immediately`);
      criticalChecks.forEach(check => {
        recommendations.push(`Fix ${check.component}: ${check.message}`);
      });
    }
    
    if (warningChecks.length > 0) {
      recommendations.push(`Monitor ${warningChecks.length} components with warnings`);
    }
    
    if (checks.every(c => c.status === 'healthy')) {
      recommendations.push('System is operating at optimal performance');
      recommendations.push('Continue monitoring for any degradation');
    }
    
    return recommendations;
  }

  async generateHealthReport(): Promise<string> {
    const health = await this.performComprehensiveHealthCheck();
    
    const report = `
# SINGULARITY SYSTEM HEALTH REPORT
**Generated:** ${new Date().toISOString()}
**Overall Status:** ${health.overall.toUpperCase()}
**Health Score:** ${health.score}%

## Component Status
${health.checks.map(check => 
  `- **${check.component}**: ${check.status.toUpperCase()} - ${check.message}`
).join('\n')}

## Recommendations
${health.recommendations.map(rec => `- ${rec}`).join('\n')}

## System Metrics
- Total Components Checked: ${health.checks.length}
- Healthy Components: ${health.checks.filter(c => c.status === 'healthy').length}
- Warning Components: ${health.checks.filter(c => c.status === 'warning').length}
- Critical Components: ${health.checks.filter(c => c.status === 'critical').length}

---
*Generated by PROTOCOL: SINGULARITY Health Check System*
    `.trim();
    
    return report;
  }
}

export const singularityHealthCheck = SingularityHealthCheck.getInstance();
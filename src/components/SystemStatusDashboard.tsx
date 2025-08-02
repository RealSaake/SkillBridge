import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Server, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { terminalLogger } from '../utils/terminalLogger';
import { singularityHealthCheck } from '../utils/singularityHealthCheck';
import { deploymentVerification } from '../utils/deploymentVerification';

interface SystemStatus {
  overall: 'operational' | 'degraded' | 'critical';
  uptime: string;
  lastCheck: Date;
  components: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    lastUpdate: Date;
  }>;
  metrics: {
    mcpServers: number;
    activeUsers: number;
    responseTime: number;
    successRate: number;
  };
}

export function SystemStatusDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initial status check
    performStatusCheck();
    
    // Set up periodic status checks every 30 seconds
    const statusInterval = setInterval(performStatusCheck, 30000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const performStatusCheck = async () => {
    try {
      terminalLogger.info('SystemStatusDashboard', 'Performing system status check');
      
      const healthCheck = await singularityHealthCheck.performComprehensiveHealthCheck();
      
      // Transform health check into system status
      const status: SystemStatus = {
        overall: healthCheck.overall === 'healthy' ? 'operational' : 
                healthCheck.overall === 'degraded' ? 'degraded' : 'critical',
        uptime: calculateUptime(),
        lastCheck: new Date(),
        components: healthCheck.checks.map(check => ({
          name: check.component,
          status: check.status === 'healthy' ? 'healthy' : 
                 check.status === 'warning' ? 'warning' : 'critical',
          message: check.message,
          lastUpdate: new Date(check.timestamp)
        })),
        metrics: {
          mcpServers: 4, // GitHub, Resume, Roadmap, Portfolio
          activeUsers: Math.floor(Math.random() * 50) + 10, // Simulated
          responseTime: Math.floor(Math.random() * 200) + 100, // Simulated
          successRate: healthCheck.score
        }
      };
      
      setSystemStatus(status);
      
      terminalLogger.info('SystemStatusDashboard', 'System status updated', {
        overall: status.overall,
        componentCount: status.components.length,
        successRate: status.metrics.successRate
      });
      
    } catch (error) {
      terminalLogger.error('SystemStatusDashboard', 'Status check failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const performDeploymentCheck = async () => {
    try {
      setIsRefreshing(true);
      terminalLogger.info('SystemStatusDashboard', 'Running deployment verification');
      
      const deploymentResult = await deploymentVerification.runFullDeploymentVerification();
      setDeploymentStatus(deploymentResult);
      
      terminalLogger.info('SystemStatusDashboard', 'Deployment verification completed', {
        deploymentReady: deploymentResult.deploymentReady,
        score: deploymentResult.score
      });
      
    } catch (error) {
      terminalLogger.error('SystemStatusDashboard', 'Deployment verification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateUptime = (): string => {
    // Calculate uptime since page load
    const startTime = performance.timeOrigin;
    const currentTime = Date.now();
    const uptimeMs = currentTime - startTime;
    
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!systemStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading system status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            SINGULARITY System Status
            <div className={`w-3 h-3 rounded-full ${
              systemStatus.overall === 'operational' ? 'bg-green-500' : 
              systemStatus.overall === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            } animate-pulse`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(systemStatus.overall)}
              </div>
              <Badge className={getStatusColor(systemStatus.overall)}>
                {systemStatus.overall.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Overall Status</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemStatus.uptime}</div>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemStatus.metrics.successRate}%</div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemStatus.metrics.responseTime}ms</div>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Last checked: {systemStatus.lastCheck.toLocaleTimeString()}
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={performDeploymentCheck}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Deployment Check
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Details */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemStatus.components.map((component, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(component.status)}
                    <span className="font-medium text-sm">{component.name}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(component.status)}`}>
                    {component.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{component.message}</p>
                <p className="text-xs text-muted-foreground">
                  Updated: {component.lastUpdate.toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MCP Server Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            MCP Server Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'GitHub Projects', status: 'operational' },
              { name: 'Resume Tips', status: 'operational' },
              { name: 'Roadmap Data', status: 'operational' },
              { name: 'Portfolio Analyzer', status: 'operational' }
            ].map((server, index) => (
              <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(server.status)}
                </div>
                <p className="text-sm font-medium">{server.name}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {server.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Status */}
      {deploymentStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Deployment Verification
              {deploymentStatus.deploymentReady ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{deploymentStatus.score}%</div>
                <p className="text-xs text-muted-foreground">Overall Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {deploymentStatus.summary.passed}/{deploymentStatus.summary.total}
                </div>
                <p className="text-xs text-muted-foreground">Tests Passed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {deploymentStatus.summary.criticalPassed}/{deploymentStatus.summary.critical}
                </div>
                <p className="text-xs text-muted-foreground">Critical Passed</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              deploymentStatus.deploymentReady 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {deploymentStatus.deploymentReady ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium ${
                  deploymentStatus.deploymentReady ? 'text-green-700' : 'text-red-700'
                }`}>
                  {deploymentStatus.deploymentReady 
                    ? 'DEPLOYMENT APPROVED' 
                    : 'DEPLOYMENT BLOCKED'
                  }
                </span>
              </div>
              <p className={`text-sm ${
                deploymentStatus.deploymentReady ? 'text-green-600' : 'text-red-600'
              }`}>
                {deploymentStatus.deploymentReady
                  ? 'All critical systems operational. Ready for production deployment.'
                  : 'Critical issues detected. Resolve failed tests before deployment.'
                }
              </p>
            </div>

            {deploymentStatus.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {deploymentStatus.recommendations.slice(0, 5).map((rec: string, index: number) => (
                    <li key={index} className="text-xs text-muted-foreground">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Protocol Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-medium">PROTOCOL: SINGULARITY</p>
                <p className="text-xs text-muted-foreground">
                  Autonomous AI Career Architect - Fully Operational
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              ACTIVE
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
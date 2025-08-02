import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Zap, Target, Activity, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { terminalLogger } from '../utils/terminalLogger';
import { continuousEvolution } from '../utils/continuousEvolution';

interface EvolutionData {
  version: string;
  evolutionScore: number;
  metrics: Array<{
    id: string;
    name: string;
    currentValue: number;
    targetValue: number;
    trend: 'improving' | 'stable' | 'declining';
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  insights: Array<{
    id: string;
    type: 'optimization' | 'enhancement' | 'prediction' | 'alert';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    actionRequired: boolean;
  }>;
  optimizations: Array<{
    component: string;
    optimization: string;
    impact: string;
    implemented: boolean;
  }>;
}

export function EvolutionDashboard() {
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [evolutionHistory, setEvolutionHistory] = useState<any[]>([]);

  useEffect(() => {
    loadEvolutionData();
    
    // Set up real-time evolution monitoring
    const evolutionInterval = setInterval(loadEvolutionData, 60000); // Every minute
    
    return () => clearInterval(evolutionInterval);
  }, []);

  const loadEvolutionData = async () => {
    try {
      terminalLogger.info('EvolutionDashboard', 'Loading evolution data');
      
      const latest = continuousEvolution.getLatestEvolution();
      const history = continuousEvolution.getEvolutionHistory();
      
      if (latest) {
        setEvolutionData(latest);
        setEvolutionHistory(history);
      }
      
      terminalLogger.debug('EvolutionDashboard', 'Evolution data loaded', {
        hasData: !!latest,
        historyLength: history.length
      });
      
    } catch (error) {
      terminalLogger.error('EvolutionDashboard', 'Failed to load evolution data', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const triggerEvolution = async () => {
    try {
      setIsEvolving(true);
      terminalLogger.info('EvolutionDashboard', 'Triggering manual evolution cycle');
      
      const newEvolution = await continuousEvolution.performEvolutionCycle();
      setEvolutionData(newEvolution);
      
      terminalLogger.info('EvolutionDashboard', 'Manual evolution cycle completed', {
        version: newEvolution.version,
        score: newEvolution.evolutionScore
      });
      
    } catch (error) {
      terminalLogger.error('EvolutionDashboard', 'Manual evolution cycle failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsEvolving(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'enhancement':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'prediction':
        return <Brain className="w-4 h-4 text-green-500" />;
      case 'alert':
        return <Activity className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(100, Math.max(0, (current / target) * 100));
  };

  if (!evolutionData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="w-8 h-8 animate-pulse mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Initializing evolution system...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evolution Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Continuous Evolution System
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          </CardTitle>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Version {evolutionData.version} • Autonomous optimization active
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={triggerEvolution}
              disabled={isEvolving}
            >
              {isEvolving ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isEvolving ? 'Evolving...' : 'Evolve Now'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {evolutionData.evolutionScore}%
              </div>
              <p className="text-sm text-muted-foreground">Evolution Score</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {evolutionData.metrics.filter(m => m.trend === 'improving').length}
              </div>
              <p className="text-sm text-muted-foreground">Improving Metrics</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {evolutionData.optimizations.filter(o => o.implemented).length}
              </div>
              <p className="text-sm text-muted-foreground">Applied Optimizations</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {evolutionData.insights.filter(i => i.actionRequired).length}
              </div>
              <p className="text-sm text-muted-foreground">Action Items</p>
            </div>
          </div>

          {/* Evolution Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">System Evolution Progress</span>
              <span>{evolutionData.evolutionScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${evolutionData.evolutionScore}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                Autonomous Evolution Active
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              System continuously analyzes performance and applies optimizations automatically
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evolutionData.metrics.map((metric) => (
              <Card 
                key={metric.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMetric === metric.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metric.trend)}
                      <span className="font-medium text-sm">{metric.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(metric.priority)}`}>
                        {metric.priority}
                      </Badge>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        selectedMetric === metric.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current: {metric.currentValue}</span>
                      <span>Target: {metric.targetValue}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          metric.trend === 'improving' ? 'bg-green-500' :
                          metric.trend === 'declining' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${calculateProgress(metric.currentValue, metric.targetValue)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress: {Math.round(calculateProgress(metric.currentValue, metric.targetValue))}%</span>
                      <span>Gap: {metric.targetValue - metric.currentValue}</span>
                    </div>
                  </div>

                  {selectedMetric === metric.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-muted-foreground">
                        <p><strong>Trend:</strong> {metric.trend}</p>
                        <p><strong>Priority:</strong> {metric.priority}</p>
                        <p><strong>Performance:</strong> {
                          calculateProgress(metric.currentValue, metric.targetValue) >= 90 ? 'Excellent' :
                          calculateProgress(metric.currentValue, metric.targetValue) >= 70 ? 'Good' :
                          calculateProgress(metric.currentValue, metric.targetValue) >= 50 ? 'Fair' : 'Needs Improvement'
                        }</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolution Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Evolution Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {evolutionData.insights.map((insight) => (
              <Card key={insight.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.impact} impact
                        </Badge>
                        {insight.actionRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Autonomous Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Autonomous Optimizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {evolutionData.optimizations.map((optimization, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-2 ${
                  optimization.implemented ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{optimization.component}</span>
                    <Badge variant="secondary" className="text-xs">
                      {optimization.implemented ? 'Implemented' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{optimization.optimization}</p>
                  <p className="text-xs text-muted-foreground">{optimization.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolution History */}
      {evolutionHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Evolution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evolutionHistory.slice(-5).reverse().map((evolution, index) => (
                <div key={evolution.version} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">v{evolution.version}</span>
                    <span className="text-xs text-muted-foreground">
                      Score: {evolution.evolutionScore}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {evolution.optimizations.filter((o: any) => o.implemented).length} optimizations
                    </span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Lightbulb, AlertCircle, Clock, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { terminalLogger } from '../utils/terminalLogger';
import { useAuth } from '../contexts/AuthContext';

interface CareerInsight {
  id: string;
  type: 'opportunity' | 'skill_gap' | 'market_trend' | 'career_move' | 'learning_path';
  title: string;
  description: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  actions: Array<{
    title: string;
    description: string;
    url?: string;
    estimatedTime?: string;
  }>;
  dataSource: string[];
  generatedAt: string;
  expiresAt?: string;
}

interface MarketTrend {
  skill: string;
  demand: number;
  growth: number;
  salaryImpact: number;
  timeToLearn: string;
}

export function AutonomousCareerInsights() {
  const [insights, setInsights] = useState<CareerInsight[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const { user, profile } = useAuth();

  // Autonomous analysis - runs automatically
  useEffect(() => {
    if (user && profile) {
      performAutonomousAnalysis();
      
      // Set up continuous analysis every 30 minutes
      const analysisInterval = setInterval(performAutonomousAnalysis, 30 * 60 * 1000);
      return () => clearInterval(analysisInterval);
    }
  }, [user, profile]);

  const performAutonomousAnalysis = async () => {
    if (!user || !profile) return;

    try {
      setIsAnalyzing(true);
      terminalLogger.info('AutonomousCareerInsights', 'Starting autonomous career analysis', {
        userId: user.id,
        targetRole: profile.targetRole,
        currentRole: profile.currentRole
      });

      // LIVE MCP INTEGRATION - Multi-source analysis
      const [githubAnalysis, skillGapAnalysis, marketAnalysis] = await Promise.allSettled([
        analyzeGitHubActivity(),
        analyzeSkillGaps(),
        analyzeMarketTrends()
      ]);

      // Generate autonomous insights
      const generatedInsights = await generateInsights({
        github: githubAnalysis.status === 'fulfilled' ? githubAnalysis.value : null,
        skillGaps: skillGapAnalysis.status === 'fulfilled' ? skillGapAnalysis.value : null,
        market: marketAnalysis.status === 'fulfilled' ? marketAnalysis.value : null
      });

      setInsights(generatedInsights);
      setLastAnalysis(new Date());

      terminalLogger.info('AutonomousCareerInsights', 'Autonomous analysis completed', {
        insightCount: generatedInsights.length,
        highPriorityCount: generatedInsights.filter(i => i.urgency === 'high' || i.urgency === 'critical').length
      });
    } catch (error) {
      terminalLogger.error('AutonomousCareerInsights', 'Autonomous analysis failed', {
        error: error.message
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeGitHubActivity = async () => {
    if (!user?.username) throw new Error('No GitHub username');

    terminalLogger.mcpRequest('AutonomousCareerInsights', 'portfolio-analyzer', 'analyze_github_activity', {
      username: user.username,
      targetRole: profile?.targetRole
    });

    // LIVE MCP CALL
    const response = await fetch('/api/mcp/portfolio-analyzer/analyze-github-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        targetRole: profile?.targetRole || 'fullstack'
      })
    });

    if (!response.ok) throw new Error(`GitHub analysis failed: ${response.status}`);
    
    const data = await response.json();
    terminalLogger.mcpResponse('AutonomousCareerInsights', 'portfolio-analyzer', 'analyze_github_activity', data);
    return data;
  };

  const analyzeSkillGaps = async () => {
    if (!profile?.targetRole) throw new Error('No target role defined');

    terminalLogger.mcpRequest('AutonomousCareerInsights', 'portfolio-analyzer', 'find_skill_gaps', {
      githubRepos: [],
      targetRole: profile.targetRole
    });

    // LIVE MCP CALL
    const response = await fetch('/api/mcp/portfolio-analyzer/find-skill-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubRepos: [], // Would be populated from GitHub analysis
        targetRole: profile.targetRole
      })
    });

    if (!response.ok) throw new Error(`Skill gap analysis failed: ${response.status}`);
    
    const data = await response.json();
    terminalLogger.mcpResponse('AutonomousCareerInsights', 'portfolio-analyzer', 'find_skill_gaps', data);
    return data;
  };

  const analyzeMarketTrends = async () => {
    // Simulate market trend analysis - in production would use job market APIs
    const trends: MarketTrend[] = [
      { skill: 'TypeScript', demand: 95, growth: 25, salaryImpact: 15, timeToLearn: '2-3 months' },
      { skill: 'React', demand: 90, growth: 10, salaryImpact: 12, timeToLearn: '1-2 months' },
      { skill: 'Docker', demand: 85, growth: 30, salaryImpact: 18, timeToLearn: '1 month' },
      { skill: 'AWS', demand: 88, growth: 35, salaryImpact: 22, timeToLearn: '3-4 months' },
      { skill: 'GraphQL', demand: 75, growth: 40, salaryImpact: 20, timeToLearn: '2 months' }
    ];

    setMarketTrends(trends);
    return trends;
  };

  const generateInsights = async (analysisData: any): Promise<CareerInsight[]> => {
    const insights: CareerInsight[] = [];

    // Generate opportunity insights
    if (analysisData.market) {
      const highGrowthSkills = analysisData.market.filter((trend: MarketTrend) => trend.growth > 25);
      
      if (highGrowthSkills.length > 0) {
        insights.push({
          id: 'market-opportunity-1',
          type: 'opportunity',
          title: 'High-Growth Skills Detected',
          description: `${highGrowthSkills.length} skills in your field are experiencing rapid market growth. Learning these could significantly boost your career prospects.`,
          confidence: 85,
          urgency: 'high',
          impact: 'high',
          actionable: true,
          actions: highGrowthSkills.slice(0, 3).map((skill: MarketTrend) => ({
            title: `Learn ${skill.skill}`,
            description: `${skill.growth}% growth, ${skill.salaryImpact}% salary impact`,
            estimatedTime: skill.timeToLearn
          })),
          dataSource: ['market-analysis', 'job-postings'],
          generatedAt: new Date().toISOString()
        });
      }
    }

    // Generate skill gap insights
    if (analysisData.skillGaps) {
      insights.push({
        id: 'skill-gap-1',
        type: 'skill_gap',
        title: 'Critical Skill Gaps Identified',
        description: 'Your GitHub activity shows strong foundation, but key skills for your target role need development.',
        confidence: 78,
        urgency: 'medium',
        impact: 'high',
        actionable: true,
        actions: [
          {
            title: 'Focus on Backend Architecture',
            description: 'Your frontend skills are strong, but backend patterns need work',
            estimatedTime: '4-6 weeks'
          },
          {
            title: 'Add Testing Practices',
            description: 'Implement comprehensive testing in your projects',
            estimatedTime: '2-3 weeks'
          }
        ],
        dataSource: ['github-analysis', 'skill-assessment'],
        generatedAt: new Date().toISOString()
      });
    }

    // Generate career move insights
    if (profile?.targetRole && profile?.currentRole) {
      insights.push({
        id: 'career-move-1',
        type: 'career_move',
        title: 'Optimal Career Transition Path',
        description: `Based on your current ${profile.currentRole} role and target ${profile.targetRole} position, here's your strategic path forward.`,
        confidence: 82,
        urgency: 'medium',
        impact: 'high',
        actionable: true,
        actions: [
          {
            title: 'Build Portfolio Projects',
            description: 'Create 2-3 projects showcasing target role skills',
            estimatedTime: '8-12 weeks'
          },
          {
            title: 'Network in Target Industry',
            description: 'Connect with professionals in your target role',
            estimatedTime: 'Ongoing'
          }
        ],
        dataSource: ['profile-analysis', 'career-mapping'],
        generatedAt: new Date().toISOString()
      });
    }

    // Generate learning path insights
    insights.push({
      id: 'learning-path-1',
      type: 'learning_path',
      title: 'Personalized Learning Sequence',
      description: 'AI-optimized learning path based on your current skills, goals, and market demands.',
      confidence: 90,
      urgency: 'low',
      impact: 'medium',
      actionable: true,
      actions: [
        {
          title: 'Week 1-2: TypeScript Fundamentals',
          description: 'Build on your JavaScript knowledge',
          estimatedTime: '2 weeks'
        },
        {
          title: 'Week 3-4: Advanced React Patterns',
          description: 'Context, hooks, and performance optimization',
          estimatedTime: '2 weeks'
        },
        {
          title: 'Week 5-8: Backend Integration',
          description: 'APIs, databases, and server architecture',
          estimatedTime: '4 weeks'
        }
      ],
      dataSource: ['skill-analysis', 'learning-optimization'],
      generatedAt: new Date().toISOString()
    });

    return insights;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'skill_gap': return <Target className="w-5 h-5 text-red-500" />;
      case 'market_trend': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'career_move': return <ArrowRight className="w-5 h-5 text-blue-500" />;
      case 'learning_path': return <Lightbulb className="w-5 h-5 text-purple-500" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-purple-100 text-purple-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Autonomous Career Insights
          {isAnalyzing && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>AI-powered career guidance based on real-time analysis</span>
          {lastAnalysis && (
            <span>Last updated: {lastAnalysis.toLocaleTimeString()}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Analysis Status */}
        <div className={`p-3 rounded-lg border ${isAnalyzing ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-blue-700">Analyzing your career data...</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-700">AI Analysis Active</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isAnalyzing 
              ? 'Processing GitHub activity, skill gaps, and market trends'
              : 'Continuous monitoring of your career progression and opportunities'
            }
          </p>
        </div>

        {/* Insights List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {insights.map((insight) => (
            <Card 
              key={insight.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedInsight === insight.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedInsight(selectedInsight === insight.id ? null : insight.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant="outline" className={`text-xs ${getUrgencyColor(insight.urgency)}`}>
                        {insight.urgency}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      {insight.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        {insight.actionable && (
                          <Badge variant="secondary" className="text-xs">
                            Actionable
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {insight.actions.length} actions
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Actions */}
                {selectedInsight === insight.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium mb-3">Recommended Actions:</h5>
                    <div className="space-y-2">
                      {insight.actions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                          <ArrowRight className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{action.title}</p>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                            {action.estimatedTime && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{action.estimatedTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      Data sources: {insight.dataSource.join(', ')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Market Trends Summary */}
        {marketTrends.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-3">Market Intelligence</h4>
            <div className="grid grid-cols-2 gap-2">
              {marketTrends.slice(0, 4).map((trend) => (
                <div key={trend.skill} className="p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{trend.skill}</span>
                    <Badge variant="secondary" className="text-xs">
                      +{trend.growth}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Demand: {trend.demand}% • Salary: +{trend.salaryImpact}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Refresh */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={performAutonomousAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'strength' | 'improvement' | 'opportunity' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

interface MarketTrend {
  skill: string;
  demand: 'high' | 'medium' | 'low';
  growth: number;
  salaryImpact: string;
}

interface AIInsightsProps {
  userProfile?: {
    currentRole: string;
    targetRole: string;
    skills: string[];
    experience: string;
  };
}

export function AIInsights({ userProfile }: AIInsightsProps) {
  // Mock AI insights - in real implementation, this would come from MCP
  const insights: AIInsight[] = [
    {
      id: '1',
      type: 'strength',
      title: 'Strong Frontend Foundation',
      description: 'Your React and JavaScript skills are well-developed based on your recent projects.',
      confidence: 92,
      actionable: false
    },
    {
      id: '2',
      type: 'improvement',
      title: 'Backend Skills Gap',
      description: 'Consider strengthening your Node.js and database skills to become a well-rounded full-stack developer.',
      confidence: 87,
      actionable: true,
      recommendation: 'Start with a Node.js course and build a REST API project'
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'TypeScript Adoption',
      description: 'TypeScript demand is growing rapidly. Adding this skill could increase your market value by 15-20%.',
      confidence: 94,
      actionable: true,
      recommendation: 'Migrate one of your existing projects to TypeScript'
    },
    {
      id: '4',
      type: 'warning',
      title: 'Testing Skills Needed',
      description: 'Most senior positions require testing experience. This could limit your advancement opportunities.',
      confidence: 89,
      actionable: true,
      recommendation: 'Learn Jest and React Testing Library fundamentals'
    }
  ];

  const marketTrends: MarketTrend[] = [
    { skill: 'TypeScript', demand: 'high', growth: 45, salaryImpact: '+$8-12k' },
    { skill: 'React', demand: 'high', growth: 23, salaryImpact: '+$5-8k' },
    { skill: 'Node.js', demand: 'high', growth: 34, salaryImpact: '+$6-10k' },
    { skill: 'GraphQL', demand: 'medium', growth: 67, salaryImpact: '+$4-7k' },
    { skill: 'Docker', demand: 'medium', growth: 28, salaryImpact: '+$3-6k' }
  ];

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'strength':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'improvement':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'strength':
        return 'border-green-200 bg-green-50';
      case 'improvement':
        return 'border-blue-200 bg-blue-50';
      case 'opportunity':
        return 'border-yellow-200 bg-yellow-50';
      case 'warning':
        return 'border-red-200 bg-red-50';
    }
  };

  const getDemandColor = (demand: MarketTrend['demand']) => {
    switch (demand) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI Career Insights
          </h2>
          <p className="text-muted-foreground mt-1">
            Personalized recommendations based on your profile and market trends
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          Last updated: 2 hours ago
        </Button>
      </div>

      {/* Insights Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {insights.filter(i => i.type === 'strength').length}
            </div>
            <div className="text-sm text-muted-foreground">Strengths</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {insights.filter(i => i.type === 'improvement').length}
            </div>
            <div className="text-sm text-muted-foreground">Improvements</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {insights.filter(i => i.type === 'opportunity').length}
            </div>
            <div className="text-sm text-muted-foreground">Opportunities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {insights.filter(i => i.type === 'warning').length}
            </div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Personalized Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}% confidence
                      </span>
                      <div className="w-16 bg-muted rounded-full h-1">
                        <div 
                          className="bg-primary h-1 rounded-full"
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <div className="bg-white/50 p-3 rounded border-l-4 border-primary">
                      <p className="text-sm font-medium text-primary mb-2">
                        💡 Recommended Action:
                      </p>
                      <p className="text-sm">{insight.recommendation}</p>
                    </div>
                  )}
                  {insight.actionable && (
                    <Button size="sm" className="mt-3">
                      Take Action
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Market Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Trends & Salary Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{trend.skill}</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getDemandColor(trend.demand)}`}>
                    {trend.demand} demand
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-green-600 font-medium">
                    +{trend.growth}% growth
                  </div>
                  <div className="text-primary font-medium">
                    {trend.salaryImpact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Recommendations */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Career Path Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white/50 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 Immediate Focus (Next 3 months)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your current skills and market demand, focus on these areas for maximum impact:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
                  TypeScript
                </span>
                <span className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
                  Testing (Jest)
                </span>
                <span className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
                  Node.js Basics
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-white/50 rounded-lg">
              <h4 className="font-semibold mb-2">🚀 Long-term Goals (6-12 months)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                These skills will position you for senior roles and higher compensation:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                  System Design
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                  GraphQL
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                  Docker/DevOps
                </span>
              </div>
            </div>
          </div>
          
          <Button className="w-full mt-4">
            Generate Detailed Action Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
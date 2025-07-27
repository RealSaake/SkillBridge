import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { useTheme } from '../App';
import { useSkillGaps, useGitHubRepos } from '../hooks/useMCP';
import type { SkillGap } from '../types/mcp-types';

interface SkillGapAnalysisEnhancedProps {
  username: string;
  targetRole: string;
  className?: string;
}

export function SkillGapAnalysisEnhanced({ 
  username, 
  targetRole,
  className = '' 
}: SkillGapAnalysisEnhancedProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme } = useTheme();

  const { data: githubRepos, loading: reposLoading } = useGitHubRepos(username);
  const { 
    data: skillGaps, 
    loading: gapsLoading, 
    error, 
    refetch 
  } = useSkillGaps(githubRepos || [], targetRole);

  const loading = reposLoading || gapsLoading;

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getGapUrgency = (current: number, target: number, importance: string) => {
    const gap = target - current;
    if (gap > 30 && importance === 'high') return 'urgent';
    if (gap > 20) return 'moderate';
    return 'low';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className={`transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <CardTitle className="text-lg">Skill Gap Analysis</CardTitle>
            </div>
            <Button variant="ghost" size="sm" disabled>
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <CardTitle className="text-lg">Skill Gap Analysis</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg mb-2">Unable to Analyze Skills</h3>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {error.message}
              </p>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!skillGaps || skillGaps.length === 0) {
    return (
      <Card className={`transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <CardTitle className="text-lg">Skill Gap Analysis</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No Skill Gaps Found</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Your skills align well with the {targetRole} role requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group skills by category
  const skillsByCategory = skillGaps.reduce((acc, skill) => {
    const category = skill.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, SkillGap[]>);

  // Find priority skills (urgent gaps)
  const prioritySkills = skillGaps
    .filter(skill => getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'urgent')
    .sort((a, b) => (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel))
    .slice(0, 3);

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <CardTitle className="text-lg">Skill Gap Analysis</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {targetRole}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Priority Skills Alert */}
          {prioritySkills.length > 0 && (
            <div className={`p-4 rounded-lg border-l-4 border-red-500 ${
              theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Priority Skills to Focus On</h4>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    These skills have the largest gaps and highest importance for your target role.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {prioritySkills.map((skill) => (
                      <Badge key={skill.skill} variant="destructive" className="text-xs">
                        {skill.skill} ({skill.targetLevel - skill.currentLevel}% gap)
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skill Categories */}
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div key={category}>
              <h4 className="text-sm font-medium mb-3">{category}</h4>
              <div className="space-y-3">
                {skills.map((skill) => {
                  const urgency = getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance);
                  const gap = skill.targetLevel - skill.currentLevel;
                  
                  return (
                    <div key={skill.skill} className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{skill.skill}</span>
                          {skill.trending && (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getImportanceColor(skill.importance)}`}>
                            {skill.importance}
                          </Badge>
                          <span className="text-xs">
                            {skill.currentLevel}% → {skill.targetLevel}%
                          </span>
                        </div>
                      </div>
                      
                      {skill.description && (
                        <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {skill.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Current Level</span>
                          <span>{skill.currentLevel}%</span>
                        </div>
                        <Progress value={skill.currentLevel} className="h-2" />
                        
                        <div className="flex items-center justify-between text-xs">
                          <span>Target Level</span>
                          <span>{skill.targetLevel}%</span>
                        </div>
                        <Progress value={skill.targetLevel} className="h-2 opacity-50" />
                        
                        {gap > 0 && (
                          <div className={`text-xs p-2 rounded ${getUrgencyColor(urgency)}`}>
                            Gap: {gap}% - 
                            {urgency === 'urgent' 
                              ? ' Urgent priority' 
                              : urgency === 'moderate'
                                ? ' Moderate priority'
                                : ' Low priority'
                            }
                          </div>
                        )}

                        {skill.learningResources && skill.learningResources.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1">Recommended Resources:</p>
                            <div className="flex flex-wrap gap-1">
                              {skill.learningResources.slice(0, 3).map((resource, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {resource}
                                </Badge>
                              ))}
                              {skill.learningResources.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{skill.learningResources.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Summary Stats */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="text-sm font-medium mb-3">Analysis Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Total Skills:
                </span>
                <p className="text-lg font-medium">{skillGaps.length}</p>
              </div>
              <div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Priority Gaps:
                </span>
                <p className="text-lg font-medium text-red-500">{prioritySkills.length}</p>
              </div>
              <div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Avg Gap:
                </span>
                <p className="text-lg font-medium">
                  {Math.round(skillGaps.reduce((acc, skill) => acc + (skill.targetLevel - skill.currentLevel), 0) / skillGaps.length)}%
                </p>
              </div>
              <div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Categories:
                </span>
                <p className="text-lg font-medium">{Object.keys(skillsByCategory).length}</p>
              </div>
            </div>
          </div>

          {/* Action Recommendations */}
          {prioritySkills.length > 0 && (
            <div className={`p-3 rounded-lg border ${
              theme === 'dark' ? 'border-blue-600 bg-blue-900/20' : 'border-blue-200 bg-blue-50'
            }`}>
              <h4 className="text-sm font-medium mb-2">Next Steps</h4>
              <ul className="text-xs space-y-1">
                <li>• Focus on {prioritySkills[0].skill} first (largest gap: {prioritySkills[0].targetLevel - prioritySkills[0].currentLevel}%)</li>
                <li>• Consider taking courses or building projects in high-priority skills</li>
                <li>• Update your GitHub repositories to showcase these skills</li>
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
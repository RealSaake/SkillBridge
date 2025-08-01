import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalizedSkillGapAnalysis } from '../hooks/usePersonalizedMCP';

interface Skill {
  name: string;
  currentLevel: number;
  targetLevel: number;
  importance: 'high' | 'medium' | 'low';
  trending: boolean;
}

interface SkillCategory {
  category: string;
  skills: Skill[];
}

export function SkillGapAnalysis() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuth();

  // Live MCP integration for skill gap analysis
  const { 
    data: skillGapData, 
    loading: analysisLoading, 
    error: analysisError,
    refetch: refetchAnalysis 
  } = usePersonalizedSkillGapAnalysis(
    user?.username || '', 
    user?.profile?.targetRole || 'fullstack-developer'
  );

  // Parse MCP response or use fallback data
  const skillData: SkillCategory[] = skillGapData?.skillCategories || [];

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getGapUrgency = (current: number, target: number, importance: string) => {
    const gap = target - current;
    if (gap > 30 && importance === 'high') return 'urgent';
    if (gap > 20) return 'moderate';
    return 'low';
  };

  const prioritySkills = skillData
    .flatMap(category => category.skills)
    .filter(skill => getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'urgent')
    .sort((a, b) => (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel))
    .slice(0, 3);

  return (
    <Card className="transition-colors duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <CardTitle className="text-lg">Skill Gap Analysis</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Loading State */}
          {analysisLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <div className="text-center">
                <p className="text-sm font-medium">Analyzing your skill gaps...</p>
                <p className="text-xs text-muted-foreground mt-1">Comparing your GitHub activity with target role requirements</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {analysisError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h4 className="text-sm font-medium text-destructive">Analysis Failed</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{analysisError}</p>
              <Button size="sm" variant="outline" onClick={refetchAnalysis}>
                Try Again
              </Button>
            </div>
          )}

          {/* No Data State */}
          {!analysisLoading && !analysisError && (!user?.username || skillData.length === 0) && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Skill Analysis Available</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {!user?.username 
                  ? 'Please connect your GitHub account to analyze your skills'
                  : 'Unable to analyze skills. Please ensure your GitHub profile is accessible.'
                }
              </p>
              {user?.username && (
                <Button onClick={refetchAnalysis}>
                  Retry Analysis
                </Button>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {!analysisLoading && !analysisError && skillData.length > 0 && (
            <>
              {/* Priority Skills Alert */}
              {prioritySkills.length > 0 && (
                <div className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Priority Skills to Focus On</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {prioritySkills.map((skill) => (
                          <span key={skill.name} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            {skill.name} ({skill.targetLevel - skill.currentLevel}% gap)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* Skill Categories */}
          {skillData.map((category) => (
            <div key={category.category}>
              <h4 className="text-sm mb-3 font-medium">{category.category}</h4>
              <div className="space-y-3">
                {category.skills.map((skill) => (
                  <div key={skill.name} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{skill.name}</span>
                        {skill.trending && (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getImportanceColor(skill.importance)}`}>
                          {skill.importance}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {skill.currentLevel}% → {skill.targetLevel}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Current Level</span>
                        <span>{skill.currentLevel}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${skill.currentLevel}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span>Target Level</span>
                        <span>{skill.targetLevel}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 opacity-50">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${skill.targetLevel}%` }}
                        />
                      </div>
                      
                      {skill.targetLevel > skill.currentLevel && (
                        <div className={`text-xs p-2 rounded ${
                          getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'moderate'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          Gap: {skill.targetLevel - skill.currentLevel}% - 
                          {getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'urgent' 
                            ? ' Urgent priority' 
                            : getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'moderate'
                              ? ' Moderate priority'
                              : ' Low priority'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

              {/* Summary Stats */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm mb-2 font-medium">Analysis Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Total Skills Tracked:
                    </span>
                    <p className="text-lg font-bold">{skillData.reduce((acc, cat) => acc + cat.skills.length, 0)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Priority Gaps:
                    </span>
                    <p className="text-lg font-bold text-red-500">{prioritySkills.length}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
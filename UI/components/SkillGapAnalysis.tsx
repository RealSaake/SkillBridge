import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useTheme } from '../App';

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
  const { theme } = useTheme();

  // Data binding: These will be populated by MCP server calls
  const skillData: SkillCategory[] = [
    {
      category: 'Frontend Technologies',
      skills: [
        { name: 'React', currentLevel: 85, targetLevel: 90, importance: 'high', trending: true },
        { name: 'TypeScript', currentLevel: 70, targetLevel: 85, importance: 'high', trending: true },
        { name: 'Next.js', currentLevel: 60, targetLevel: 80, importance: 'medium', trending: true },
        { name: 'Tailwind CSS', currentLevel: 75, targetLevel: 85, importance: 'medium', trending: false },
      ]
    },
    {
      category: 'Backend & Tools',
      skills: [
        { name: 'Node.js', currentLevel: 70, targetLevel: 80, importance: 'high', trending: false },
        { name: 'Docker', currentLevel: 40, targetLevel: 75, importance: 'high', trending: true },
        { name: 'GraphQL', currentLevel: 30, targetLevel: 70, importance: 'medium', trending: true },
        { name: 'AWS', currentLevel: 35, targetLevel: 65, importance: 'high', trending: false },
      ]
    }
  ];

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

  const prioritySkills = skillData
    .flatMap(category => category.skills)
    .filter(skill => getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'urgent')
    .sort((a, b) => (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel))
    .slice(0, 3);

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
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
          {/* Priority Skills Alert */}
          {prioritySkills.length > 0 && (
            <div className={`p-4 rounded-lg border-l-4 border-red-500 ${
              theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm">Priority Skills to Focus On</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {prioritySkills.map((skill) => (
                      <Badge key={skill.name} variant="destructive" className="text-xs">
                        {skill.name} ({skill.targetLevel - skill.currentLevel}% gap)
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skill Categories */}
          {skillData.map((category) => (
            <div key={category.category}>
              <h4 className="text-sm mb-3">{category.category}</h4>
              <div className="space-y-3">
                {category.skills.map((skill) => (
                  <div key={skill.name} className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{skill.name}</span>
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
                      
                      {skill.targetLevel > skill.currentLevel && (
                        <div className={`text-xs p-2 rounded ${
                          getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'urgent'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                            : getGapUrgency(skill.currentLevel, skill.targetLevel, skill.importance) === 'moderate'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
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
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h4 className="text-sm mb-2">Analysis Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Total Skills Tracked:
                </span>
                <p className="text-lg">{skillData.reduce((acc, cat) => acc + cat.skills.length, 0)}</p>
              </div>
              <div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Priority Gaps:
                </span>
                <p className="text-lg text-red-500">{prioritySkills.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
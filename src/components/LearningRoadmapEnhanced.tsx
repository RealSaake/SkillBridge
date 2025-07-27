import React, { useState } from 'react';
import { BookOpen, Clock, CheckCircle, PlayCircle, ChevronDown, ChevronUp, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { useTheme } from '../App';
import { useLearningRoadmap } from '../hooks/useMCP';
import type { LearningRoadmap } from '../types/mcp-types';

interface LearningRoadmapEnhancedProps {
  targetRole: string;
  currentSkills?: string[];
  className?: string;
}

export function LearningRoadmapEnhanced({ 
  targetRole, 
  currentSkills = [],
  className = '' 
}: LearningRoadmapEnhancedProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { theme } = useTheme();

  const { 
    data: roadmapData, 
    loading, 
    error, 
    refetch 
  } = useLearningRoadmap(targetRole, currentSkills);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'video':
        return <PlayCircle className="w-4 h-4" />;
      case 'project':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in-progress':
        return 'text-blue-500';
      case 'not-started':
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  if (loading) {
    return (
      <Card className={`transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <CardTitle className="text-lg">Learning Roadmap</CardTitle>
            </div>
            <Button variant="ghost" size="sm" disabled>
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 flex-1" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
              <BookOpen className="w-5 h-5" />
              <CardTitle className="text-lg">Learning Roadmap</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg mb-2">Unable to Load Roadmap</h3>
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

  if (!roadmapData) {
    return null;
  }

  const currentWeek = roadmapData.weeks.find(week => week.week === selectedWeek);
  const totalItems = roadmapData.weeks.reduce((acc, week) => acc + week.items.length, 0);
  const completedItems = roadmapData.weeks.reduce((acc, week) => 
    acc + week.items.filter(item => item.status === 'completed').length, 0);
  const inProgressItems = roadmapData.weeks.reduce((acc, week) => 
    acc + week.items.filter(item => item.status === 'in-progress').length, 0);

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <CardTitle className="text-lg">Learning Roadmap</CardTitle>
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
          {/* Progress Overview */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm">Overall Progress</h4>
              <span className="text-xs text-green-500">
                {roadmapData.estimatedWeeks} weeks • {roadmapData.totalHours}h total
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl text-green-500">{completedItems}</div>
                <div className="text-xs">Completed</div>
              </div>
              <div>
                <div className="text-2xl text-blue-500">{inProgressItems}</div>
                <div className="text-xs">In Progress</div>
              </div>
              <div>
                <div className="text-2xl">{totalItems - completedItems - inProgressItems}</div>
                <div className="text-xs">Remaining</div>
              </div>
            </div>
            <Progress value={(completedItems / totalItems) * 100} className="mt-3 h-2" />
          </div>

          {/* Week Navigation */}
          <div>
            <h4 className="text-sm mb-3">{roadmapData.estimatedWeeks}-Week Learning Plan</h4>
            <div className="flex space-x-2 mb-4 overflow-x-auto">
              {roadmapData.weeks.map((week) => (
                <Button
                  key={week.week}
                  variant={selectedWeek === week.week ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeek(week.week)}
                  className="flex-shrink-0"
                >
                  Week {week.week}
                </Button>
              ))}
            </div>
          </div>

          {/* Current Week Content */}
          {currentWeek && (
            <div>
              <div className="mb-4">
                <h4 className="text-lg">Week {currentWeek.week}: {currentWeek.theme}</h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentWeek.description || 'Focus area for this week'}
                </p>
              </div>

              <div className="space-y-3">
                {currentWeek.items.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className={getStatusColor(item.status)}>
                          {item.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            getTypeIcon(item.type)
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium">{item.title}</h5>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.provider} • {item.duration}
                          </p>
                          {item.description && (
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                        <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {item.status === 'in-progress' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.skill}
                        </Badge>
                        {item.prerequisites && item.prerequisites.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Prerequisites: {item.prerequisites.join(', ')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {item.status === 'not-started' && (
                          <Button size="sm" variant="outline">
                            Start
                          </Button>
                        )}
                        {item.status === 'in-progress' && (
                          <Button size="sm" variant="outline">
                            Continue
                          </Button>
                        )}
                        {item.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        )}
                        {item.url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Completion */}
          <div className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'border-blue-600 bg-blue-900/20' : 'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  Estimated completion: {roadmapData.estimatedWeeks} weeks ({roadmapData.hoursPerWeek}h/week)
                </span>
              </div>
              {roadmapData.difficulty && (
                <Badge className={`text-xs ${getDifficultyColor(roadmapData.difficulty)}`}>
                  {roadmapData.difficulty} level
                </Badge>
              )}
            </div>
          </div>

          {/* Skills Focus */}
          {roadmapData.skillsFocus && roadmapData.skillsFocus.length > 0 && (
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className="text-sm mb-2">Skills You'll Learn</h4>
              <div className="flex flex-wrap gap-2">
                {roadmapData.skillsFocus.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
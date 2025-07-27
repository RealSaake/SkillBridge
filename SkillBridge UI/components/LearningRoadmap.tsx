import React, { useState } from 'react';
import { BookOpen, Clock, CheckCircle, PlayCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useTheme } from '../App';

interface LearningItem {
  id: string;
  title: string;
  type: 'course' | 'article' | 'project' | 'video';
  provider: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  skill: string;
  priority: 'high' | 'medium' | 'low';
  url?: string;
}

interface RoadmapWeek {
  week: number;
  theme: string;
  items: LearningItem[];
}

export function LearningRoadmap() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { theme } = useTheme();

  const roadmap: RoadmapWeek[] = [
    {
      week: 1,
      theme: "Docker Fundamentals",
      items: [
        {
          id: '1',
          title: 'Docker for Developers',
          type: 'course',
          provider: 'Docker',
          duration: '4 hours',
          difficulty: 'beginner',
          status: 'in-progress',
          progress: 60,
          skill: 'Docker',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Containerizing a React App',
          type: 'project',
          provider: 'Self-guided',
          duration: '2 hours',
          difficulty: 'intermediate',
          status: 'not-started',
          progress: 0,
          skill: 'Docker',
          priority: 'high'
        }
      ]
    },
    {
      week: 2,
      theme: "Advanced TypeScript",
      items: [
        {
          id: '3',
          title: 'TypeScript Advanced Types',
          type: 'course',
          provider: 'Frontend Masters',
          duration: '5 hours',
          difficulty: 'advanced',
          status: 'not-started',
          progress: 0,
          skill: 'TypeScript',
          priority: 'high'
        },
        {
          id: '4',
          title: 'Building Type-Safe APIs',
          type: 'project',
          provider: 'Self-guided',
          duration: '6 hours',
          difficulty: 'advanced',
          status: 'not-started',
          progress: 0,
          skill: 'TypeScript',
          priority: 'medium'
        }
      ]
    },
    {
      week: 3,
      theme: "GraphQL Implementation",
      items: [
        {
          id: '5',
          title: 'GraphQL with Apollo',
          type: 'course',
          provider: 'Apollo GraphQL',
          duration: '8 hours',
          difficulty: 'intermediate',
          status: 'not-started',
          progress: 0,
          skill: 'GraphQL',
          priority: 'medium'
        },
        {
          id: '6',
          title: 'Building a GraphQL API',
          type: 'project',
          provider: 'Self-guided',
          duration: '10 hours',
          difficulty: 'advanced',
          status: 'not-started',
          progress: 0,
          skill: 'GraphQL',
          priority: 'medium'
        }
      ]
    },
    {
      week: 4,
      theme: "AWS Fundamentals",
      items: [
        {
          id: '7',
          title: 'AWS Cloud Practitioner',
          type: 'course',
          provider: 'AWS',
          duration: '12 hours',
          difficulty: 'beginner',
          status: 'not-started',
          progress: 0,
          skill: 'AWS',
          priority: 'high'
        },
        {
          id: '8',
          title: 'Deploy React App to AWS',
          type: 'project',
          provider: 'Self-guided',
          duration: '4 hours',
          difficulty: 'intermediate',
          status: 'not-started',
          progress: 0,
          skill: 'AWS',
          priority: 'medium'
        }
      ]
    }
  ];

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

  const currentWeek = roadmap.find(week => week.week === selectedWeek);
  const totalItems = roadmap.reduce((acc, week) => acc + week.items.length, 0);
  const completedItems = roadmap.reduce((acc, week) => 
    acc + week.items.filter(item => item.status === 'completed').length, 0);
  const inProgressItems = roadmap.reduce((acc, week) => 
    acc + week.items.filter(item => item.status === 'in-progress').length, 0);

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <CardTitle className="text-lg">Learning Roadmap</CardTitle>
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
          {/* Progress Overview */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="text-sm mb-3">Overall Progress</h4>
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
            <h4 className="text-sm mb-3">4-Week Learning Plan</h4>
            <div className="flex space-x-2 mb-4">
              {roadmap.map((week) => (
                <Button
                  key={week.week}
                  variant={selectedWeek === week.week ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeek(week.week)}
                  className="flex-1"
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
                  Focus area for this week
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
                          <h5 className="text-sm">{item.title}</h5>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.provider} • {item.duration}
                          </p>
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
                      <Badge variant="secondary" className="text-xs">
                        {item.skill}
                      </Badge>
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
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                Estimated completion: 4 weeks (based on 10 hours/week)
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
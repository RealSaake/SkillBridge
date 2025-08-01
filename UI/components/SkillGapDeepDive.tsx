import React, { useState } from 'react';
import { Target, TrendingUp, Clock, BookOpen, ArrowRight, Calendar, Award, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTheme, useApp } from '../App';

interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  marketDemand: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeToTarget: string;
  learningPath: string[];
  marketSalaryImpact: string;
}

interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'tutorial' | 'project';
  provider: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  url: string;
}

interface SkillComparison {
  skill: string;
  yourLevel: number;
  roleAverage: number;
  topPerformer: number;
  marketDemand: number;
}

export function SkillGapDeepDive() {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [timeframe, setTimeframe] = useState('3-months');
  const { theme } = useTheme();
  const { setCurrentView } = useApp();

  // Data binding: These will be populated by MCP server calls
  const skillGaps: SkillGap[] = [
    {
      skill: "TypeScript",
      currentLevel: 70,
      targetLevel: 85, 
      marketDemand: 92,
      priority: "critical",
      timeToTarget: "6-8 weeks",
      learningPath: ["TypeScript Fundamentals", "Advanced Types", "Project Implementation"],
      marketSalaryImpact: "+15%"
    },
    {
      skill: "Docker",
      currentLevel: 40,
      targetLevel: 75, 
      marketDemand: 88,
      priority: "high",
      timeToTarget: "4-6 weeks",
      learningPath: ["Container Basics", "Docker Compose", "Production Deployment"],
      marketSalaryImpact: "+12%"
    },
    {
      skill: "AWS",
      currentLevel: 35,
      targetLevel: 65, 
      marketDemand: 85,
      priority: "medium",
      timeToTarget: "8-10 weeks",
      learningPath: ["AWS Fundamentals", "EC2 & S3", "Lambda Functions"],
      marketSalaryImpact: "+18%"
    }
  ];

  const skillComparisons: SkillComparison[] = [
    {
      skill: "TypeScript",
      yourLevel: 70,
      roleAverage: 80,
      topPerformer: 95,
      marketDemand: 92
    },
    {
      skill: "React",
      yourLevel: 85,
      roleAverage: 75,
      topPerformer: 90,
      marketDemand: 90
    },
    {
      skill: "Docker",
      yourLevel: 40,
      roleAverage: 70,
      topPerformer: 85,
      marketDemand: 88
    }
  ];

  const learningResources: LearningResource[] = [
    {
      title: "TypeScript Handbook",
      type: "course",
      provider: "TypeScript Official",
      duration: "6 weeks",
      difficulty: "intermediate",
      rating: 4.8,
      url: "#"
    },
    {
      title: "Docker Mastery Course",
      type: "course",
      provider: "Udemy",
      duration: "12 hours",
      difficulty: "beginner",
      rating: 4.6,
      url: "#"
    },
    {
      title: "React TypeScript Project",
      type: "project",
      provider: "GitHub",
      duration: "2 weeks",
      difficulty: "advanced",
      rating: 4.5,
      url: "#"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'project':
        return <Award className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Skill Gap Analysis</h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Deep dive into your skill development roadmap
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-month">1 Month Focus</SelectItem>
              <SelectItem value="3-months">3 Month Plan</SelectItem>
              <SelectItem value="6-months">6 Month Strategy</SelectItem>
              <SelectItem value="1-year">1 Year Roadmap</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Priority Skills Sidebar */}
        <Card className={`lg:col-span-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Priority Skills</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillGaps.slice(0, 5).map((gap, index) => (
              <div 
                key={gap.skill}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSkill === gap.skill
                    ? 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedSkill(gap.skill)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{gap.skill}</span>
                  <Badge className={`text-xs ${getPriorityColor(gap.priority)}`}>
                    {gap.priority}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Current</span>
                    <span>{gap.currentLevel}%</span>
                  </div>
                  <Progress value={gap.currentLevel} className="h-2" />
                  
                  <div className="flex justify-between text-xs">
                    <span>Target</span>
                    <span>{gap.targetLevel}%</span>
                  </div>
                  <Progress value={gap.targetLevel} className="h-2 opacity-50" />
                </div>

                <div className="flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{gap.timeToTarget}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>{gap.marketSalaryImpact}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary Stats */}
            <div className={`p-4 rounded-lg border-t ${
              theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-100'
            }`}>
              <h4 className="text-sm mb-2">Focus Summary</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Critical gaps:</span>
                  <span className="text-red-500">2</span>
                </div>
                <div className="flex justify-between">
                  <span>Total learning hours:</span>
                  <span>120h</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary impact:</span>
                  <span className="text-green-500">+25%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className={`lg:col-span-3 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-0">
            <Tabs defaultValue="timeline" className="w-full">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="timeline">Learning Timeline</TabsTrigger>
                  <TabsTrigger value="comparison">Role Comparison</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="timeline" className="p-6 pt-4">
                <div className="space-y-6">
                  {/* Timeline Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg">Learning Timeline ({timeframe})</h3>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">12 weeks • 10h/week</span>
                    </div>
                  </div>

                  {/* Timeline Visualization */}
                  <div className="space-y-4">
                    {/* Week blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className={`p-4 rounded-lg border ${
                          i < 4 
                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                            : i < 8
                              ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                              : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Week {i + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {i < 4 ? 'Phase 1' : i < 8 ? 'Phase 2' : 'Phase 3'}
                            </Badge>
                          </div>
                          <h4 className="text-sm mb-1">
                            {i < 4 ? 'TypeScript' : i < 8 ? 'Docker' : 'AWS'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {i < 4 ? 'Fundamentals' : i < 8 ? 'Containerization' : 'Cloud Services'}
                          </p>
                          <div className="mt-2">
                            <Progress value={i < 4 ? 75 : i < 8 ? 50 : 25} className="h-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="text-sm mb-3">Key Milestones</h4>
                    <div className="space-y-3">
                      <div className={`flex items-center space-x-4 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <Award className="w-6 h-6 text-blue-500" />
                        <div className="flex-1">
                          <h5 className="text-sm">TypeScript Certification</h5>
                          <p className="text-xs text-gray-500">Complete advanced TypeScript concepts and build a project</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Week 6
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comparison" className="p-6 pt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg mb-4">How You Compare</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your skill levels compared to others in your target role
                    </p>
                  </div>

                  <div className="space-y-4">
                    {skillComparisons.map((comparison) => (
                      <Card key={comparison.skill} className={`${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm">{comparison.skill}</h4>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm">High Demand</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Your Level</span>
                                <span>{comparison.yourLevel}%</span>
                              </div>
                              <Progress value={comparison.yourLevel} className="h-2" />
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Role Average</span>
                                <span>{comparison.roleAverage}%</span>
                              </div>
                              <Progress value={comparison.roleAverage} className="h-2 opacity-60" />
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Top Performers</span>
                                <span>{comparison.topPerformer}%</span>
                              </div>
                              <Progress value={comparison.topPerformer} className="h-2 opacity-40" />
                            </div>
                          </div>

                          {comparison.yourLevel < comparison.roleAverage && (
                            <div className={`mt-3 p-2 rounded text-xs ${
                              theme === 'dark' ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Below role average - prioritize for improvement</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="p-6 pt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg mb-4">Recommended Learning Resources</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      AI-curated resources based on your learning style and goals
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {learningResources.map((resource, index) => (
                      <Card key={index} className={`${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(resource.type)}
                              <div>
                                <h4 className="text-sm">{resource.title}</h4>
                                <p className="text-xs text-gray-500">{resource.provider}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${
                                  i < Math.floor(resource.rating) ? 'bg-yellow-400' : 'bg-gray-300'
                                }`} />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Duration: {resource.duration}</span>
                              <Badge className={`text-xs ${getDifficultyColor(resource.difficulty)}`}>
                                {resource.difficulty}
                              </Badge>
                            </div>
                            
                            <Button variant="outline" size="sm" className="w-full">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Start Learning
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Learning Preferences */}
                  <Card className={`${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <h4 className="text-sm mb-3">Personalized Recommendations</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Learning Style:</span>
                          <p>Visual + Hands-on</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Time Available:</span>
                          <p>10h/week</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Preferred Format:</span>
                          <p>Video + Projects</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Difficulty Level:</span>
                          <p>Intermediate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="roadmap" className="p-6 pt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg mb-4">Skill Development Roadmap</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your personalized path to reaching target skill levels
                    </p>
                  </div>

                  {/* Roadmap Visualization */}
                  <div className="space-y-6">
                    {skillGaps.slice(0, 3).map((gap, index) => (
                      <div key={gap.skill} className="relative">
                        {/* Connecting Line */}
                        {index < skillGaps.length - 1 && (
                          <div className="absolute left-4 top-16 w-0.5 h-20 bg-gray-300 dark:bg-gray-600" />
                        )}
                        
                        <div className="flex items-start space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm text-white ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {index + 1}
                          </div>
                          
                          <Card className={`flex-1 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm">{gap.skill}</h4>
                                <Badge className={`text-xs ${getPriorityColor(gap.priority)}`}>
                                  {gap.priority} priority
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <span className="text-xs text-gray-500">Current Level</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Progress value={gap.currentLevel} className="h-2 flex-1" />
                                    <span className="text-sm">{gap.currentLevel}%</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="text-xs text-gray-500">Target Level</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Progress value={gap.targetLevel} className="h-2 flex-1" />
                                    <span className="text-sm">{gap.targetLevel}%</span>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-xs text-gray-500">Market Demand</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Progress value={gap.marketDemand} className="h-2 flex-1" />
                                    <span className="text-sm">{gap.marketDemand}%</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{gap.timeToTarget}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                    <span>{gap.marketSalaryImpact} salary impact</span>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  Start Learning Path
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import { BookOpen, Clock, CheckCircle, PlayCircle, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalizedLearningRoadmap } from '../hooks/usePersonalizedMCP';

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
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const { user, profile, updateProgress } = useAuth();

  // Live MCP integration for learning roadmap
  const { 
    data: roadmapData, 
    loading: roadmapLoading, 
    error: roadmapError,
    refetch: refetchRoadmap 
  } = usePersonalizedLearningRoadmap(
    profile?.targetRole || 'fullstack-developer',
    profile?.techStack || []
  );

  // Handle progress updates
  const handleProgressUpdate = useCallback(async (itemId: string, newStatus: 'not-started' | 'in-progress' | 'completed') => {
    if (!profile) return;
    
    setUpdatingProgress(itemId);
    try {
      // Get current completed steps for the roadmap
      const roadmapId = `${profile.targetRole}-roadmap`;
      const currentProgress = profile.roadmapProgress?.[roadmapId]?.completedSteps || [];
      
      let updatedSteps: string[];
      if (newStatus === 'completed' && !currentProgress.includes(itemId)) {
        updatedSteps = [...currentProgress, itemId];
      } else if (newStatus !== 'completed' && currentProgress.includes(itemId)) {
        updatedSteps = currentProgress.filter(step => step !== itemId);
      } else {
        updatedSteps = currentProgress;
      }
      
      await updateProgress(roadmapId, updatedSteps);
      console.log('✅ Progress updated successfully');
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
    } finally {
      setUpdatingProgress(null);
    }
  }, [profile, updateProgress]);

  // Get completed steps from profile
  const roadmapId = `${profile?.targetRole || 'fullstack-developer'}-roadmap`;
  const completedSteps = profile?.roadmapProgress?.[roadmapId]?.completedSteps || [];

  // Parse MCP response or use fallback data with progress from profile
  const roadmap: RoadmapWeek[] = (roadmapData?.weeks || [
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
  ]).map((week: RoadmapWeek) => ({
    ...week,
    items: week.items.map((item: LearningItem) => ({
      ...item,
      status: completedSteps.includes(item.id) ? 'completed' as const : item.status
    }))
  }));

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
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const currentWeek = roadmap.find(week => week.week === selectedWeek);
  const totalItems = roadmap.reduce((acc, week) => acc + week.items.length, 0);
  const completedItems = roadmap.reduce((acc, week) => 
    acc + week.items.filter(item => item.status === 'completed').length, 0);
  const inProgressItems = roadmap.reduce((acc, week) => 
    acc + week.items.filter(item => item.status === 'in-progress').length, 0);

  return (
    <Card className="transition-colors duration-300">
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
          {/* Loading State */}
          {roadmapLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <div className="text-center">
                <p className="text-sm font-medium">Generating your learning roadmap...</p>
                <p className="text-xs text-muted-foreground mt-1">Creating personalized learning path based on your profile</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {roadmapError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-destructive" />
                <h4 className="text-sm font-medium text-destructive">Roadmap Generation Failed</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{roadmapError}</p>
              <Button size="sm" variant="outline" onClick={refetchRoadmap}>
                Try Again
              </Button>
            </div>
          )}

          {/* No Data State */}
          {!roadmapLoading && !roadmapError && roadmap.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Learning Roadmap Available</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Complete your profile setup to generate a personalized learning roadmap
              </p>
              <Button onClick={refetchRoadmap}>
                Generate Roadmap
              </Button>
            </div>
          )}

          {/* Roadmap Content */}
          {!roadmapLoading && !roadmapError && roadmap.length > 0 && (
            <>
              {/* Progress Overview */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm mb-3 font-medium">Overall Progress</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-500">{completedItems}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{inProgressItems}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalItems - completedItems - inProgressItems}</div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
                  />
                </div>
              </div>

          {/* Week Navigation */}
          <div>
            <h4 className="text-sm mb-3 font-medium">4-Week Learning Plan</h4>
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
                <h4 className="text-lg font-semibold">Week {currentWeek.week}: {currentWeek.theme}</h4>
                <p className="text-sm text-muted-foreground">
                  Focus area for this week
                </p>
              </div>

              <div className="space-y-3">
                {currentWeek.items.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border bg-muted/30">
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
                          <p className="text-xs text-muted-foreground">
                            {item.provider} • {item.duration}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty}
                        </span>
                      </div>
                    </div>

                    {item.status === 'in-progress' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                        {item.skill}
                      </span>
                      <div className="flex space-x-2">
                        {item.status === 'not-started' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleProgressUpdate(item.id, 'in-progress')}
                            disabled={updatingProgress === item.id}
                          >
                            {updatingProgress === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Start'}
                          </Button>
                        )}
                        {item.status === 'in-progress' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleProgressUpdate(item.id, 'completed')}
                              disabled={updatingProgress === item.id}
                            >
                              {updatingProgress === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Complete'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleProgressUpdate(item.id, 'not-started')}
                              disabled={updatingProgress === item.id}
                            >
                              Reset
                            </Button>
                          </>
                        )}
                        {item.status === 'completed' && (
                          <>
                            <Button size="sm" variant="outline" disabled>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleProgressUpdate(item.id, 'not-started')}
                              disabled={updatingProgress === item.id}
                            >
                              Reset
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

              {/* Estimated Completion */}
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    Estimated completion: {roadmap.length} weeks (based on 10 hours/week)
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
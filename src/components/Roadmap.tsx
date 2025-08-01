import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  Code, 
  Trophy,
  ArrowRight,
  Target
} from 'lucide-react';

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  estimatedTime: string;
  skills: string[];
  resources: Array<{
    title: string;
    type: 'course' | 'article' | 'project' | 'book';
    url: string;
  }>;
}

interface RoadmapProps {
  targetRole: string;
}

export function Roadmap({ targetRole }: RoadmapProps) {
  // Mock roadmap data - in real implementation, this would come from MCP
  const roadmapSteps: RoadmapStep[] = [
    {
      id: '1',
      title: 'Master JavaScript Fundamentals',
      description: 'Build a solid foundation in JavaScript ES6+, async programming, and modern syntax.',
      status: 'completed',
      estimatedTime: '4-6 weeks',
      skills: ['JavaScript', 'ES6+', 'Async/Await', 'Promises'],
      resources: [
        { title: 'JavaScript: The Complete Guide', type: 'course', url: '#' },
        { title: 'You Don\'t Know JS', type: 'book', url: '#' },
        { title: 'Build a Todo App', type: 'project', url: '#' }
      ]
    },
    {
      id: '2',
      title: 'React Development',
      description: 'Learn React hooks, state management, and component architecture patterns.',
      status: 'current',
      estimatedTime: '6-8 weeks',
      skills: ['React', 'Hooks', 'State Management', 'Component Design'],
      resources: [
        { title: 'React - The Complete Guide', type: 'course', url: '#' },
        { title: 'React Patterns', type: 'article', url: '#' },
        { title: 'E-commerce Dashboard', type: 'project', url: '#' }
      ]
    },
    {
      id: '3',
      title: 'Backend Integration',
      description: 'Master API integration, authentication, and data fetching patterns.',
      status: 'upcoming',
      estimatedTime: '4-5 weeks',
      skills: ['REST APIs', 'GraphQL', 'Authentication', 'Data Fetching'],
      resources: [
        { title: 'API Design Best Practices', type: 'course', url: '#' },
        { title: 'Authentication Patterns', type: 'article', url: '#' },
        { title: 'Full-Stack App', type: 'project', url: '#' }
      ]
    },
    {
      id: '4',
      title: 'Testing & Deployment',
      description: 'Implement comprehensive testing strategies and CI/CD pipelines.',
      status: 'upcoming',
      estimatedTime: '3-4 weeks',
      skills: ['Jest', 'React Testing Library', 'CI/CD', 'Docker'],
      resources: [
        { title: 'Testing JavaScript Applications', type: 'course', url: '#' },
        { title: 'Deployment Strategies', type: 'article', url: '#' },
        { title: 'Production App', type: 'project', url: '#' }
      ]
    }
  ];

  const getStatusIcon = (status: RoadmapStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'current':
        return <Clock className="w-6 h-6 text-primary" />;
      case 'upcoming':
        return <Circle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'project':
        return <Code className="w-4 h-4" />;
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const completedSteps = roadmapSteps.filter(step => step.status === 'completed').length;
  const totalSteps = roadmapSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            {targetRole.replace('-', ' ')} Roadmap
          </h2>
          <p className="text-muted-foreground mt-1">
            Your personalized learning path to become a {targetRole.replace('-', ' ')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{completedSteps}/{totalSteps}</div>
          <div className="text-sm text-muted-foreground">Steps Completed</div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">
              {completedSteps > 0 ? `Great progress! ${totalSteps - completedSteps} steps remaining.` : 'Ready to start your journey!'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Steps */}
      <div className="space-y-4">
        {roadmapSteps.map((step, index) => (
          <Card key={step.id} className={`transition-all duration-200 ${
            step.status === 'current' ? 'ring-2 ring-primary/20 bg-primary/5' : ''
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {step.estimatedTime}
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Skills You'll Learn</h4>
                <div className="flex flex-wrap gap-2">
                  {step.skills.map((skill, skillIndex) => (
                    <span 
                      key={skillIndex}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Learning Resources</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {step.resources.map((resource, resourceIndex) => (
                    <div 
                      key={resourceIndex}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      {getResourceIcon(resource.type)}
                      <span className="text-sm truncate">{resource.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {step.status === 'current' && (
                <Button className="w-full">
                  Continue Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {step.status === 'upcoming' && (
                <Button variant="outline" className="w-full" disabled>
                  Complete Previous Steps First
                </Button>
              )}
              
              {step.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed - Great job!
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">What's Next?</h3>
          <p className="text-muted-foreground mb-4">
            After completing this roadmap, you'll be ready for {targetRole.replace('-', ' ')} positions. 
            Consider exploring advanced topics like system design, performance optimization, and leadership skills.
          </p>
          <Button variant="outline">
            Explore Advanced Roadmaps
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
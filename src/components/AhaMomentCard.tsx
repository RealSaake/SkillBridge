import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useCareerInsights } from '../hooks/useCareerInsights';
import { logUserAction, logInfo } from '../utils/logger';

interface QuizData {
  currentRole: string;
  experienceLevel: string;
  targetRole: string;
  primaryGoals: string[];
  techStack: string[];
  learningStyle: string;
  timeCommitment: string;
}

interface GitHubInsight {
  totalRepos: number;
  languages: string[];
  mostUsedLanguage: string;
  recentActivity: boolean;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface PersonalizedInsight {
  title: string;
  description: string;
  icon: string;
  type: 'strength' | 'opportunity' | 'recommendation';
  confidence: number;
}

interface ActionableStep {
  title: string;
  description: string;
  timeEstimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  resources: Array<{
    title: string;
    url: string;
    type: 'course' | 'article' | 'video' | 'practice';
  }>;
}

interface AhaMomentCardProps {
  quizData: QuizData;
  onContinue: () => void;
}

export const AhaMomentCard: React.FC<AhaMomentCardProps> = ({ quizData, onContinue }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [actionSteps, setActionSteps] = useState<ActionableStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  // Use MCP servers for real career insights
  const { 
    insights: mcpInsights, 
    loading: mcpLoading, 
    fetchInsights 
  } = useCareerInsights({
    targetRole: quizData.targetRole,
    githubUsername: user?.username,
    autoFetch: true
  });

  useEffect(() => {
    generatePersonalizedInsights();
  }, [quizData, user, mcpInsights]);

  const generatePersonalizedInsights = async () => {
    setLoading(true);
    
    try {
      // Get real GitHub data from user profile
      const githubInsight: GitHubInsight = {
        totalRepos: user?.publicRepos || 0,
        languages: ['JavaScript', 'Python', 'TypeScript'], // Would come from real analysis
        mostUsedLanguage: 'JavaScript',
        recentActivity: true,
        skillLevel: mapExperienceToSkillLevel(quizData.experienceLevel)
      };

      // Combine MCP insights with our analysis
      let generatedInsights = await analyzeUserProfile(quizData, githubInsight);
      
      // Enhance with MCP server insights if available
      if (mcpInsights && mcpInsights.length > 0) {
        const mcpEnhancedInsights = mcpInsights.slice(0, 2).map(mcpInsight => ({
          title: mcpInsight.title,
          description: mcpInsight.description,
          icon: getInsightIcon(mcpInsight.type),
          type: 'recommendation' as const,
          confidence: mcpInsight.confidence
        }));
        
        // Replace some generated insights with MCP insights
        generatedInsights = [...mcpEnhancedInsights, ...generatedInsights.slice(mcpEnhancedInsights.length)];
      }

      const generatedSteps = await generateActionSteps(quizData, githubInsight);

      setInsights(generatedInsights);
      setActionSteps(generatedSteps);

      // Log the aha moment generation
      logUserAction('aha_moment_generated', {
        userId: user?.id,
        targetRole: quizData.targetRole,
        experienceLevel: quizData.experienceLevel,
        insightCount: generatedInsights.length,
        stepCount: generatedSteps.length,
        usedMcpInsights: mcpInsights?.length || 0
      });

    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string): string => {
    switch (type) {
      case 'skill_gap': return '🎯';
      case 'roadmap': return '🗺️';
      case 'resume_tip': return '📄';
      case 'github_analysis': return '🚀';
      default: return '💡';
    }
  };

  const mapExperienceToSkillLevel = (experience: string): GitHubInsight['skillLevel'] => {
    switch (experience) {
      case 'beginner': return 'beginner';
      case 'intermediate': return 'intermediate';
      case 'advanced': return 'advanced';
      case 'expert': return 'expert';
      default: return 'intermediate';
    }
  };

  const analyzeUserProfile = async (quiz: QuizData, github: GitHubInsight): Promise<PersonalizedInsight[]> => {
    const insights: PersonalizedInsight[] = [];

    // Career Transition Insight
    if (quiz.currentRole !== quiz.targetRole) {
      const transitionComplexity = calculateTransitionComplexity(quiz.currentRole, quiz.targetRole);
      insights.push({
        title: `Your ${quiz.targetRole.replace('-', ' ')} transition is ${transitionComplexity.difficulty}`,
        description: `Based on your ${quiz.currentRole} background and ${quiz.techStack.length} technologies, you're ${transitionComplexity.readiness}% ready for this transition. ${transitionComplexity.insight}`,
        icon: '🎯',
        type: 'opportunity',
        confidence: transitionComplexity.readiness
      });
    }

    // GitHub Activity Insight
    if (github.totalRepos > 0) {
      const activityInsight = analyzeGitHubActivity(github, quiz);
      insights.push(activityInsight);
    }

    // Learning Style Optimization
    const learningInsight = optimizeLearningPath(quiz);
    insights.push(learningInsight);

    // Skill Stack Analysis
    const skillInsight = analyzeSkillStack(quiz.techStack, quiz.targetRole);
    insights.push(skillInsight);

    return insights.slice(0, 3); // Return top 3 insights
  };

  const calculateTransitionComplexity = (current: string, target: string) => {
    // Simplified transition analysis - in real app, this would be more sophisticated
    const transitionMap: Record<string, Record<string, { difficulty: string; readiness: number; insight: string }>> = {
      'Frontend Developer': {
        'fullstack-developer': {
          difficulty: 'moderate',
          readiness: 75,
          insight: 'Your frontend skills give you a strong foundation - focus on backend technologies and databases.'
        },
        'backend-developer': {
          difficulty: 'challenging',
          readiness: 45,
          insight: 'This transition requires learning server-side technologies, but your programming fundamentals will help.'
        }
      },
      'Student': {
        'frontend-developer': {
          difficulty: 'achievable',
          readiness: 60,
          insight: 'Perfect timing to specialize! Your learning mindset is your biggest advantage.'
        },
        'fullstack-developer': {
          difficulty: 'ambitious',
          readiness: 40,
          insight: 'This is a comprehensive path that will take time, but the job market rewards full-stack skills highly.'
        }
      }
    };

    return transitionMap[current]?.[target] || {
      difficulty: 'unique',
      readiness: 50,
      insight: 'Your career path is unique - we\'ll create a custom roadmap based on your specific background.'
    };
  };

  const analyzeGitHubActivity = (github: GitHubInsight, quiz: QuizData): PersonalizedInsight => {
    if (github.totalRepos >= 10) {
      return {
        title: `You're a prolific builder with ${github.totalRepos} repositories!`,
        description: `Your ${github.mostUsedLanguage} expertise and consistent coding activity show you're ready for senior-level opportunities. Consider contributing to open source projects to boost your visibility.`,
        icon: '🚀',
        type: 'strength',
        confidence: 85
      };
    } else if (github.totalRepos >= 3) {
      return {
        title: 'Your GitHub shows solid project experience',
        description: `With ${github.totalRepos} repositories, you demonstrate practical skills. Focus on creating 2-3 more polished projects to showcase your ${quiz.targetRole.replace('-', ' ')} abilities.`,
        icon: '📈',
        type: 'opportunity',
        confidence: 70
      };
    } else {
      return {
        title: 'Time to showcase your skills on GitHub!',
        description: 'Building a strong GitHub portfolio is crucial for landing your target role. Start with 3-5 projects that demonstrate your core skills.',
        icon: '💡',
        type: 'recommendation',
        confidence: 90
      };
    }
  };

  const optimizeLearningPath = (quiz: QuizData): PersonalizedInsight => {
    const timeCommitmentHours = {
      '1-2-hours': 1.5,
      '3-5-hours': 4,
      '6-10-hours': 8,
      '10-plus-hours': 15
    }[quiz.timeCommitment] || 4;

    const learningStyleBenefits = {
      'hands-on': 'project-based learning will accelerate your progress',
      'structured': 'systematic courses will give you comprehensive knowledge',
      'reading': 'documentation mastery will make you a strong problem-solver',
      'videos': 'visual learning will help you grasp complex concepts quickly',
      'community': 'peer learning will expand your network and knowledge'
    };

    return {
      title: `Your ${quiz.learningStyle} approach is perfect for ${timeCommitmentHours}h/week`,
      description: `With ${timeCommitmentHours} hours weekly, ${learningStyleBenefits[quiz.learningStyle as keyof typeof learningStyleBenefits]}. You could master your target skills in ${Math.ceil(200 / timeCommitmentHours)} weeks.`,
      icon: '⚡',
      type: 'strength',
      confidence: 80
    };
  };

  const analyzeSkillStack = (techStack: string[], targetRole: string): PersonalizedInsight => {
    const roleRequirements = {
      'frontend-developer': ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript'],
      'backend-developer': ['Node.js', 'Python', 'Java', 'PostgreSQL', 'REST APIs'],
      'fullstack-developer': ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      'data-scientist': ['Python', 'SQL', 'Machine Learning', 'Pandas', 'NumPy']
    };

    const required = roleRequirements[targetRole as keyof typeof roleRequirements] || [];
    const matchingSkills = techStack.filter(skill => required.includes(skill));
    const missingSkills = required.filter(skill => !techStack.includes(skill));

    const matchPercentage = Math.round((matchingSkills.length / required.length) * 100);

    if (matchPercentage >= 80) {
      return {
        title: `You have ${matchPercentage}% of required ${targetRole.replace('-', ' ')} skills!`,
        description: `Strong match! You know ${matchingSkills.join(', ')}. Focus on mastering ${missingSkills.slice(0, 2).join(' and ')} to become job-ready.`,
        icon: '🎯',
        type: 'strength',
        confidence: matchPercentage
      };
    } else if (matchPercentage >= 50) {
      return {
        title: `You're ${matchPercentage}% ready with a solid foundation`,
        description: `Good progress! Your ${matchingSkills.join(', ')} skills are valuable. Priority learning: ${missingSkills.slice(0, 3).join(', ')}.`,
        icon: '📚',
        type: 'opportunity',
        confidence: matchPercentage
      };
    } else {
      return {
        title: 'Exciting learning journey ahead!',
        description: `You're starting fresh with ${targetRole.replace('-', ' ')}. Focus on core skills: ${missingSkills.slice(0, 3).join(', ')}. Your ${techStack.length > 0 ? 'existing programming experience' : 'motivation'} will accelerate your learning.`,
        icon: '🌟',
        type: 'recommendation',
        confidence: 75
      };
    }
  };

  const generateActionSteps = async (quiz: QuizData, github: GitHubInsight): Promise<ActionableStep[]> => {
    const steps: ActionableStep[] = [];

    // Step 1: Immediate skill building
    const prioritySkill = getPrioritySkill(quiz.targetRole, quiz.techStack);
    steps.push({
      title: `Master ${prioritySkill} in 2 weeks`,
      description: `${prioritySkill} is essential for ${quiz.targetRole.replace('-', ' ')} roles and will give you immediate value.`,
      timeEstimate: '2 weeks',
      difficulty: 'medium',
      resources: getSkillResources(prioritySkill, quiz.learningStyle)
    });

    // Step 2: Portfolio project
    steps.push({
      title: 'Build a standout portfolio project',
      description: `Create a ${quiz.targetRole.replace('-', ' ')} project that showcases your skills to employers.`,
      timeEstimate: '3-4 weeks',
      difficulty: 'medium',
      resources: getProjectResources(quiz.targetRole, quiz.learningStyle)
    });

    // Step 3: Career-specific action
    const careerStep = getCareerSpecificStep(quiz);
    steps.push(careerStep);

    return steps;
  };

  const getPrioritySkill = (targetRole: string, currentSkills: string[]): string => {
    const priorities = {
      'frontend-developer': ['React', 'TypeScript', 'JavaScript', 'CSS'],
      'backend-developer': ['Node.js', 'Python', 'PostgreSQL', 'REST APIs'],
      'fullstack-developer': ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      'data-scientist': ['Python', 'Pandas', 'SQL', 'Machine Learning']
    };

    const rolePriorities = priorities[targetRole as keyof typeof priorities] || ['JavaScript'];
    return rolePriorities.find(skill => !currentSkills.includes(skill)) || rolePriorities[0];
  };

  const getSkillResources = (skill: string, learningStyle: string) => {
    const resourceMap: Record<string, Record<string, Array<{ title: string; url: string; type: 'course' | 'article' | 'video' | 'practice' }>>> = {
      'React': {
        'hands-on': [
          { title: 'React Official Tutorial', url: 'https://react.dev/learn', type: 'practice' },
          { title: 'Build 15 React Projects', url: 'https://www.youtube.com/watch?v=a_7Z7C_JCyo', type: 'video' }
        ],
        'structured': [
          { title: 'Complete React Course 2024', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', type: 'course' },
          { title: 'React Documentation', url: 'https://react.dev', type: 'article' }
        ],
        'videos': [
          { title: 'React Crash Course', url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', type: 'video' },
          { title: 'React Hooks Explained', url: 'https://www.youtube.com/watch?v=O6P86uwfdR0', type: 'video' }
        ]
      }
    };

    return resourceMap[skill]?.[learningStyle] || [
      { title: `Learn ${skill} - Official Docs`, url: '#', type: 'article' as const },
      { title: `${skill} Crash Course`, url: '#', type: 'video' as const }
    ];
  };

  const getProjectResources = (targetRole: string, learningStyle: string) => {
    const projectIdeas = {
      'frontend-developer': [
        { title: 'Build a Weather App with React', url: 'https://www.freecodecamp.org/news/learn-react-by-building-a-weather-app/', type: 'practice' as const },
        { title: 'Portfolio Website Tutorial', url: 'https://www.youtube.com/watch?v=bmpI252DmiI', type: 'video' as const }
      ],
      'backend-developer': [
        { title: 'REST API with Node.js', url: 'https://www.freecodecamp.org/news/build-a-restful-api-using-node-express-and-mongodb/', type: 'practice' as const },
        { title: 'Database Design Course', url: 'https://www.coursera.org/learn/database-design', type: 'course' as const }
      ]
    };

    return projectIdeas[targetRole as keyof typeof projectIdeas] || [
      { title: 'Build Your First Project', url: '#', type: 'practice' as const }
    ];
  };

  const getCareerSpecificStep = (quiz: QuizData): ActionableStep => {
    if (quiz.primaryGoals.includes('Get my first developer job')) {
      return {
        title: 'Optimize your job search strategy',
        description: 'Prepare your resume, practice coding interviews, and start networking in the developer community.',
        timeEstimate: '2-3 weeks',
        difficulty: 'easy',
        resources: [
          { title: 'Tech Resume Template', url: 'https://www.overleaf.com/latex/templates/software-engineer-resume/gqxmqsvsbdjf', type: 'article' },
          { title: 'LeetCode Practice', url: 'https://leetcode.com/explore/interview/card/top-interview-questions-easy/', type: 'practice' },
          { title: 'Networking for Developers', url: 'https://www.freecodecamp.org/news/networking-for-developers/', type: 'article' }
        ]
      };
    } else if (quiz.primaryGoals.includes('Contribute to open source')) {
      return {
        title: 'Make your first open source contribution',
        description: 'Find beginner-friendly projects and start contributing to build your reputation in the community.',
        timeEstimate: '1-2 weeks',
        difficulty: 'easy',
        resources: [
          { title: 'First Contributions Guide', url: 'https://github.com/firstcontributions/first-contributions', type: 'practice' },
          { title: 'Good First Issues', url: 'https://goodfirstissues.com/', type: 'practice' }
        ]
      };
    } else {
      return {
        title: 'Join the developer community',
        description: 'Connect with other developers, share your progress, and learn from the community.',
        timeEstimate: '1 week',
        difficulty: 'easy',
        resources: [
          { title: 'Dev.to Community', url: 'https://dev.to/', type: 'article' },
          { title: 'Discord Developer Communities', url: 'https://discord.com/invite/programming', type: 'practice' }
        ]
      };
    }
  };

  const nextInsight = () => {
    setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentInsightIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const handleContinue = () => {
    logUserAction('aha_moment_completed', {
      userId: user?.id,
      targetRole: quizData.targetRole,
      timeSpent: Date.now() // Would calculate actual time spent
    });

    logInfo('User completed aha moment and proceeding to dashboard', {
      userId: user?.id,
      insightsViewed: currentInsightIndex + 1
    }, 'AhaMomentCard');

    onContinue();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing your profile...</h2>
            <p className="text-gray-600">
              We're combining your quiz responses with your GitHub activity to create personalized insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentInsight = insights[currentInsightIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">✨</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Biggest Insight</h1>
          <p className="text-xl text-gray-600">Based on your profile and GitHub activity</p>
        </div>

        {/* Main Insight Card */}
        <Card className="mb-8 border-2 border-purple-200 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{currentInsight?.icon}</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentInsight?.title}</h2>
              <p className="text-lg text-gray-700 leading-relaxed">{currentInsight?.description}</p>
            </div>

            {/* Confidence Meter */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Confidence Level</span>
                <span>{currentInsight?.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${currentInsight?.confidence}%` }}
                ></div>
              </div>
            </div>

            {/* Navigation */}
            {insights.length > 1 && (
              <div className="flex justify-center items-center gap-4 mb-6">
                <Button variant="outline" size="sm" onClick={prevInsight}>
                  ← Previous
                </Button>
                <span className="text-sm text-gray-600">
                  {currentInsightIndex + 1} of {insights.length} insights
                </span>
                <Button variant="outline" size="sm" onClick={nextInsight}>
                  Next →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Steps */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Next 3 Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {actionSteps.map((step, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">⏱️ {step.timeEstimate}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      step.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      step.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {step.difficulty}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Recommended Resources:</h4>
                    {step.resources.slice(0, 2).map((resource, resourceIndex) => (
                      <a
                        key={resourceIndex}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-purple-600 hover:text-purple-800 hover:underline"
                      >
                        📚 {resource.title}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to start your journey?</h3>
              <p className="text-purple-100 mb-6">
                Your personalized dashboard is waiting with detailed roadmaps, progress tracking, and more insights.
              </p>
              <Button 
                onClick={handleContinue}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3"
              >
                Go to My Dashboard →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
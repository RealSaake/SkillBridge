import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// AhaMomentCard removed - implementing simplified flow

interface QuizData {
  currentRole: string;
  experienceLevel: string;
  targetRole: string;
  primaryGoals: string[];
  techStack: string[];
  learningStyle: string;
  timeCommitment: string;
}

export const OnboardingQuiz: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAhaMoment, setShowAhaMoment] = useState(false);
  const [quizData, setQuizData] = useState<QuizData>({
    currentRole: '',
    experienceLevel: '',
    targetRole: '',
    primaryGoals: [],
    techStack: [],
    learningStyle: '',
    timeCommitment: ''
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateQuizData = () => {
    const errors = [];
    
    if (!quizData.currentRole || quizData.currentRole.trim().length === 0) {
      errors.push('Current role is required');
    }
    
    if (!quizData.experienceLevel || quizData.experienceLevel.trim().length === 0) {
      errors.push('Experience level is required');
    }
    
    if (!quizData.targetRole || quizData.targetRole.trim().length === 0) {
      errors.push('Target role is required');
    }
    
    if (!quizData.primaryGoals || quizData.primaryGoals.length === 0) {
      errors.push('At least one primary goal is required');
    }
    
    if (!quizData.techStack || quizData.techStack.length === 0) {
      errors.push('At least one technology is required');
    } else if (quizData.techStack.length > 20) {
      errors.push('Please select no more than 20 technologies');
    }
    
    if (!quizData.learningStyle || quizData.learningStyle.trim().length === 0) {
      errors.push('Learning style is required');
    }
    
    if (!quizData.timeCommitment || quizData.timeCommitment.trim().length === 0) {
      errors.push('Time commitment is required');
    }
    
    if (quizData.primaryGoals.length > 10) {
      errors.push('Please select no more than 10 primary goals');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate quiz data
      const validationErrors = validateQuizData();
      if (validationErrors.length > 0) {
        alert('Please fix the following issues:\n' + validationErrors.join('\n'));
        return;
      }

      // Prepare and sanitize profile data
      const profileData = {
        currentRole: quizData.currentRole.trim(),
        targetRole: quizData.targetRole.trim(),
        experienceLevel: quizData.experienceLevel.trim(),
        techStack: quizData.techStack.map(tech => tech.trim()).filter(tech => tech.length > 0),
        careerGoal: quizData.primaryGoals.join(', ').trim(),
        learningStyle: quizData.learningStyle.trim(),
        timeCommitment: quizData.timeCommitment.trim()
      };

      // Additional validation
      if (profileData.careerGoal.length > 500) {
        alert('Career goals are too long. Please keep them under 500 characters.');
        return;
      }

      // Create profile using the new API endpoint
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Authentication token not found. Please sign in again.');
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/profilesCreate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Profile creation error:', errorData);
        
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          window.location.href = '/login';
          return;
        } else if (response.status === 409) {
          alert('You already have a profile. Redirecting to dashboard...');
          window.location.href = '/dashboard';
          return;
        } else {
          throw new Error(errorData.error || 'Failed to create profile');
        }
      }

      const result = await response.json();
      console.log('✅ Profile created successfully:', result);

      // Refresh user data to include the new profile
      await refreshUserData();

      // Show the Aha! moment instead of going directly to dashboard
      setShowAhaMoment(true);
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save your profile: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAhaMomentContinue = () => {
    navigate('/dashboard', { replace: true });
  };

  const updateQuizData = (field: keyof QuizData, value: any) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof QuizData, item: string) => {
    const currentArray = quizData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateQuizData(field, newArray);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your current role?</h2>
              <p className="text-gray-600">Help us understand where you are in your career journey</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Student',
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'Data Scientist',
                'DevOps Engineer',
                'Mobile Developer',
                'UI/UX Designer',
                'Product Manager',
                'Career Changer',
                'Other'
              ].map((role) => (
                <button
                  key={role}
                  onClick={() => updateQuizData('currentRole', role)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    quizData.currentRole === role
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your experience level?</h2>
              <p className="text-gray-600">This helps us tailor recommendations to your skill level</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'beginner', label: 'Beginner (0-1 years)', desc: 'Just starting out or learning the basics' },
                { value: 'intermediate', label: 'Intermediate (1-3 years)', desc: 'Have some experience and working on projects' },
                { value: 'advanced', label: 'Advanced (3-5 years)', desc: 'Experienced with complex projects and mentoring' },
                { value: 'expert', label: 'Expert (5+ years)', desc: 'Senior level with deep expertise and leadership' }
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => updateQuizData('experienceLevel', level.value)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    quizData.experienceLevel === level.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{level.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Where do you want to go?</h2>
              <p className="text-gray-600">Select your target role to get personalized roadmaps</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'frontend-developer', label: 'Frontend Developer', desc: 'React, Vue, Angular, UI/UX' },
                { value: 'backend-developer', label: 'Backend Developer', desc: 'APIs, databases, server architecture' },
                { value: 'fullstack-developer', label: 'Full Stack Developer', desc: 'Frontend + Backend + DevOps' },
                { value: 'data-scientist', label: 'Data Scientist', desc: 'ML, AI, data analysis, Python' },
                { value: 'devops-engineer', label: 'DevOps Engineer', desc: 'CI/CD, cloud, infrastructure' },
                { value: 'mobile-developer', label: 'Mobile Developer', desc: 'iOS, Android, React Native' },
                { value: 'tech-lead', label: 'Tech Lead', desc: 'Technical leadership and architecture' },
                { value: 'engineering-manager', label: 'Engineering Manager', desc: 'Team leadership and management' }
              ].map((role) => (
                <button
                  key={role.value}
                  onClick={() => updateQuizData('targetRole', role.value)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    quizData.targetRole === role.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{role.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{role.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your primary goals?</h2>
              <p className="text-gray-600">Select all that apply - we'll prioritize these in your roadmap</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Get my first developer job',
                'Switch to a new technology stack',
                'Advance to senior level',
                'Become a team lead',
                'Start freelancing',
                'Build a side project',
                'Contribute to open source',
                'Learn new programming languages',
                'Improve system design skills',
                'Get better at algorithms',
                'Build a portfolio',
                'Prepare for interviews'
              ].map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleArrayItem('primaryGoals', goal)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    quizData.primaryGoals.includes(goal)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded border-2 mr-3 ${
                      quizData.primaryGoals.includes(goal)
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {quizData.primaryGoals.includes(goal) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {goal}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What technologies do you know?</h2>
              <p className="text-gray-600">Select your current tech stack so we can build on your existing skills</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#',
                'React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django',
                'Flask', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB',
                'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
                'Git', 'Linux', 'GraphQL', 'REST APIs', 'Microservices'
              ].map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleArrayItem('techStack', tech)}
                  className={`p-3 text-center rounded-lg border-2 transition-all ${
                    quizData.techStack.includes(tech)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How do you prefer to learn?</h2>
              <p className="text-gray-600">We'll recommend resources that match your learning style</p>
            </div>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { value: 'hands-on', label: 'Hands-on Projects', desc: 'Learn by building real applications' },
                { value: 'structured', label: 'Structured Courses', desc: 'Step-by-step tutorials and courses' },
                { value: 'reading', label: 'Documentation & Articles', desc: 'Reading docs, blogs, and books' },
                { value: 'videos', label: 'Video Tutorials', desc: 'YouTube, Udemy, and video content' },
                { value: 'community', label: 'Community Learning', desc: 'Forums, Discord, and peer learning' }
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => updateQuizData('learningStyle', style.value)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    quizData.learningStyle === style.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{style.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{style.desc}</div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How much time can you dedicate to learning?</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: '1-2-hours', label: '1-2 hours per week', desc: 'Casual learning pace' },
                  { value: '3-5-hours', label: '3-5 hours per week', desc: 'Steady progress' },
                  { value: '6-10-hours', label: '6-10 hours per week', desc: 'Accelerated learning' },
                  { value: '10-plus-hours', label: '10+ hours per week', desc: 'Intensive bootcamp style' }
                ].map((time) => (
                  <button
                    key={time.value}
                    onClick={() => updateQuizData('timeCommitment', time.value)}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      quizData.timeCommitment === time.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{time.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{time.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1: return quizData.currentRole !== '';
      case 2: return quizData.experienceLevel !== '';
      case 3: return quizData.targetRole !== '';
      case 4: return quizData.primaryGoals.length > 0;
      case 5: return quizData.techStack.length > 0;
      case 6: return quizData.learningStyle !== '' && quizData.timeCommitment !== '';
      default: return false;
    }
  };

  // Show completion message after quiz
  if (showAhaMoment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Profile Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Your career profile has been set up successfully. You can now access personalized insights and recommendations.
            </p>
            <Button onClick={handleAhaMomentContinue} size="lg">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">SB</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">SkillBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name || user?.username}!</h1>
          <p className="text-gray-600">Let's personalize your learning journey</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Quiz Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6"
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!isStepComplete() || loading}
            className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? 'Saving...' : currentStep === totalSteps ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};
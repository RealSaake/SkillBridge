import React, { useState } from 'react';
import { Github, Upload, User, Target, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { useTheme, useApp } from '../App';

interface ProfileFormData {
  fullName: string;
  email: string;
  githubUsername: string;
  targetRole: string;
  experienceLevel: string;
  focusAreas: string[];
  resumeUploaded: boolean;
}

export function ProfileSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    githubUsername: '',
    targetRole: '',
    experienceLevel: '',
    focusAreas: [],
    resumeUploaded: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { setUser, setCurrentView } = useApp();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const targetRoles = [
    'Frontend Developer',
    'Backend Developer', 
    'Full Stack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'Product Manager',
    'UI/UX Designer'
  ];

  const experienceLevels = [
    'Entry Level (0-2 years)',
    'Mid Level (2-5 years)', 
    'Senior Level (5-8 years)',
    'Staff/Principal (8+ years)'
  ];

  const focusAreaOptions = [
    'Technical Skills Development',
    'Resume & Portfolio Enhancement', 
    'Interview Preparation',
    'Career Transition',
    'Salary Negotiation',
    'Leadership & Management',
    'Open Source Contribution',
    'Networking & Personal Brand'
  ];

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: checked 
        ? [...prev.focusAreas, area]
        : prev.focusAreas.filter(a => a !== area)
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Simulate API call to save user profile
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Set user data for the app
    setUser({
      fullName: formData.fullName,
      email: formData.email,
      githubUsername: formData.githubUsername,
      targetRole: formData.targetRole,
      experienceLevel: formData.experienceLevel,
      focusAreas: formData.focusAreas,
      resumeUploaded: formData.resumeUploaded,
      initials: formData.fullName.split(' ').map(n => n[0]).join(''),
      skillScore: 72, // Mock initial score
      avatarUrl: null
    });
    
    setCurrentView('dashboard');
    setIsLoading(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email;
      case 2:
        return formData.githubUsername;
      case 3:
        return formData.targetRole && formData.experienceLevel;
      case 4:
        return formData.focusAreas.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl mb-2">Welcome to SkillBridge</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Let's set up your profile to get personalized career insights
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  We'll use this to send you personalized career insights
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Github className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl mb-2">Connect Your GitHub</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                We'll analyze your code activity to provide personalized insights
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="githubUsername">GitHub Username *</Label>
                <div className="flex mt-1">
                  <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-300' 
                      : 'bg-gray-50 border-gray-300 text-gray-500'
                  }`}>
                    github.com/
                  </span>
                  <Input
                    id="githubUsername"
                    placeholder="your-username"
                    value={formData.githubUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, githubUsername: e.target.value }))}
                    className="rounded-l-none"
                  />
                </div>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your GitHub data helps us understand your technical skills and activity
                </p>
              </div>

              {/* GitHub Connection Status */}
              <div className={`p-4 rounded-lg border ${
                formData.githubUsername 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {formData.githubUsername ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm">Ready to connect</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          We'll analyze your commits and repositories for insights
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Github className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm">GitHub not connected</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Enter your username to enable code analysis
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl mb-2">Define Your Goals</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Tell us about your career aspirations and current level
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="targetRole">Target Role *</Label>
                <Select 
                  value={formData.targetRole} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetRole: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetRoles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <Select 
                  value={formData.experienceLevel} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Resume Upload */}
              <div>
                <Label>Resume Upload (Optional)</Label>
                <div className={`mt-1 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  theme === 'dark' 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm mb-1">Upload your resume for AI analysis</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    PDF format, max 5MB
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Choose File
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl mb-2">Choose Your Focus Areas</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Select the areas where you'd like AI assistance (choose at least one)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {focusAreaOptions.map((area) => (
                <div key={area} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  formData.focusAreas.includes(area)
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    : theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-200 bg-gray-50'
                }`}>
                  <Checkbox
                    id={area}
                    checked={formData.focusAreas.includes(area)}
                    onCheckedChange={(checked) => handleFocusAreaChange(area, checked as boolean)}
                  />
                  <Label htmlFor={area} className="text-sm cursor-pointer flex-1">
                    {area}
                  </Label>
                </div>
              ))}
            </div>

            {formData.focusAreas.length > 0 && (
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
              }`}>
                <p className="text-sm">
                  Great! You've selected {formData.focusAreas.length} focus area{formData.focusAreas.length > 1 ? 's' : ''}. 
                  Our AI will prioritize these areas in your personalized recommendations.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className={`w-full max-w-2xl ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader className="text-center">
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Setting up your profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
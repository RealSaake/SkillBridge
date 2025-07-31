import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://skillbridge-career-dev.web.app';

interface ProfileData {
  currentRole: string;
  targetRole: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  careerGoals: string[];
  bio?: string;
  location?: string;
  website?: string;
  linkedinUrl?: string;
}

export const ProfileSetup: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    currentRole: '',
    targetRole: '',
    experienceLevel: 'intermediate',
    careerGoals: [],
    bio: '',
    location: '',
    website: '',
    linkedinUrl: ''
  });

  const [newGoal, setNewGoal] = useState('');

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCareerGoal = () => {
    if (newGoal.trim() && profileData.careerGoals.length < 5) {
      setProfileData(prev => ({
        ...prev,
        careerGoals: [...prev.careerGoals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeCareerGoal = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      careerGoals: prev.careerGoals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profiles`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        updateUser({ profile: updatedProfile });
        navigate('/dashboard');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = profileData.currentRole && profileData.targetRole && profileData.experienceLevel;
  const canComplete = canProceedToStep2 && profileData.careerGoals.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">SB</span>
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to SkillBridge, {user?.name || user?.username}!
          </CardTitle>
          <CardDescription>
            Let's set up your profile to provide personalized career guidance
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Step 1: Career Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Role *
                  </label>
                  <input
                    type="text"
                    value={profileData.currentRole}
                    onChange={(e) => handleInputChange('currentRole', e.target.value)}
                    placeholder="e.g., Frontend Developer, Student, Career Changer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role *
                  </label>
                  <input
                    type="text"
                    value={profileData.targetRole}
                    onChange={(e) => handleInputChange('targetRole', e.target.value)}
                    placeholder="e.g., Senior Full Stack Developer, Data Scientist"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    value={profileData.experienceLevel}
                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner (0-1 years)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3-7 years)</option>
                    <option value="expert">Expert (7+ years)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Step 2: Career Goals & Additional Info</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Career Goals * (Add up to 5)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="e.g., Learn React, Get AWS certification"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addCareerGoal()}
                    />
                    <Button
                      onClick={addCareerGoal}
                      disabled={!newGoal.trim() || profileData.careerGoals.length >= 5}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {profileData.careerGoals.length > 0 && (
                    <div className="space-y-2">
                      {profileData.careerGoals.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                          <span className="text-sm">{goal}</span>
                          <button
                            onClick={() => removeCareerGoal(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself, your interests, and what drives you..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={profileData.linkedinUrl}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                >
                  Back
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!canComplete || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your GitHub profile will be analyzed for skills</li>
              <li>• Personalized learning roadmaps will be generated</li>
              <li>• Resume feedback will be tailored to your goals</li>
              <li>• Progress tracking will begin immediately</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
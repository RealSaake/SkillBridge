import React, { useState, useCallback } from 'react';
import { terminalLogger } from '../../../utils/terminalLogger';

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  skills: string[];
  isCore?: boolean;
}

interface SkillAssessment {
  category: string;
  current: number;
  target: number;
  importance: number;
  experience: string;
}

interface SkillAssessmentOnboardingProps {
  onComplete: (assessments: SkillAssessment[]) => void;
  onSkip?: () => void;
  className?: string;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'frontend',
    name: 'Frontend Development',
    description: 'User interface and client-side development',
    icon: '🎨',
    skills: ['React', 'Vue.js', 'Angular', 'HTML/CSS', 'JavaScript', 'TypeScript'],
    isCore: true
  },
  {
    id: 'backend',
    name: 'Backend Development',
    description: 'Server-side development and APIs',
    icon: '⚙️',
    skills: ['Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust'],
    isCore: true
  },
  {
    id: 'database',
    name: 'Database & Storage',
    description: 'Data management and storage solutions',
    icon: '🗄️',
    skills: ['SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Elasticsearch']
  },
  {
    id: 'devops',
    name: 'DevOps & Infrastructure',
    description: 'Deployment, monitoring, and infrastructure',
    icon: '🚀',
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform']
  },
  {
    id: 'mobile',
    name: 'Mobile Development',
    description: 'iOS and Android app development',
    icon: '📱',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin']
  },
  {
    id: 'data',
    name: 'Data Science & ML',
    description: 'Data analysis and machine learning',
    icon: '📊',
    skills: ['Python', 'R', 'TensorFlow', 'PyTorch', 'Pandas']
  }
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'advanced', label: 'Advanced', description: 'Solid experience' },
  { value: 'expert', label: 'Expert', description: 'Deep expertise' }
];

export const SkillAssessmentOnboarding: React.FC<SkillAssessmentOnboardingProps> = ({
  onComplete,
  onSkip,
  className = ''
}) => {
  const [step, setStep] = useState<'categories' | 'assessment' | 'review'>('categories');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [assessments, setAssessments] = useState<Map<string, SkillAssessment>>(new Map());
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  const selectedCategoryList = Array.from(selectedCategories);
  const currentCategory = selectedCategoryList[currentCategoryIndex];

  const handleCategoryToggle = useCallback((categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
    
    terminalLogger.info('SkillAssessmentOnboarding', 'Category selection changed', {
      categoryId,
      isSelected: newSelected.has(categoryId),
      totalSelected: newSelected.size
    });
  }, [selectedCategories]);

  const handleStartAssessment = useCallback(() => {
    if (selectedCategories.size === 0) {
      terminalLogger.warn('SkillAssessmentOnboarding', 'No categories selected');
      return;
    }

    terminalLogger.info('SkillAssessmentOnboarding', 'Starting skill assessment', {
      selectedCategories: Array.from(selectedCategories),
      totalCategories: selectedCategories.size
    });

    setStep('assessment');
    setCurrentCategoryIndex(0);
  }, [selectedCategories]);

  const handleAssessmentSubmit = useCallback((assessment: SkillAssessment) => {
    const newAssessments = new Map(assessments);
    newAssessments.set(currentCategory, assessment);
    setAssessments(newAssessments);

    terminalLogger.debug('SkillAssessmentOnboarding', 'Assessment submitted', {
      category: currentCategory,
      assessment
    });

    if (currentCategoryIndex < selectedCategoryList.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    } else {
      setStep('review');
    }
  }, [assessments, currentCategory, currentCategoryIndex, selectedCategoryList.length]);

  const handleComplete = useCallback(() => {
    const finalAssessments = Array.from(assessments.values());
    
    terminalLogger.info('SkillAssessmentOnboarding', 'Assessment completed', {
      totalAssessments: finalAssessments.length,
      categories: finalAssessments.map(a => a.category)
    });

    onComplete(finalAssessments);
  }, [assessments, onComplete]);

  const handleSkip = useCallback(() => {
    terminalLogger.info('SkillAssessmentOnboarding', 'Assessment skipped');
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  const renderCategorySelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Select Your Skill Areas
        </h3>
        <p className="text-gray-600">
          Choose the categories you want to assess. We'll help you identify your current level and growth opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SKILL_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.has(category.id);
          
          return (
            <div
              key={category.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleCategoryToggle(category.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{category.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    {category.isCore && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Core
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {category.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {category.skills.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{category.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Skip Assessment
        </button>
        <button
          onClick={handleStartAssessment}
          disabled={selectedCategories.size === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Assessment ({selectedCategories.size} selected)
        </button>
      </div>
    </div>
  );

  const renderAssessment = () => {
    const category = SKILL_CATEGORIES.find(c => c.id === currentCategory);
    if (!category) return null;

    return (
      <SkillCategoryAssessment
        category={category}
        onSubmit={handleAssessmentSubmit}
        progress={{
          current: currentCategoryIndex + 1,
          total: selectedCategoryList.length
        }}
      />
    );
  };

  const renderReview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Review Your Assessment
        </h3>
        <p className="text-gray-600">
          Here's a summary of your skill assessment. You can always update this later.
        </p>
      </div>

      <div className="space-y-4">
        {Array.from(assessments.entries()).map(([categoryId, assessment]) => {
          const category = SKILL_CATEGORIES.find(c => c.id === categoryId);
          if (!category) return null;

          return (
            <div key={categoryId} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {assessment.experience}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Current Level</div>
                  <div className="font-medium">{assessment.current}/10</div>
                </div>
                <div>
                  <div className="text-gray-600">Target Level</div>
                  <div className="font-medium">{assessment.target}/10</div>
                </div>
                <div>
                  <div className="text-gray-600">Importance</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={`w-2 h-2 rounded-full ${
                          level <= assessment.importance ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep('assessment')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back to Edit
        </button>
        <button
          onClick={handleComplete}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Complete Assessment
        </button>
      </div>
    </div>
  );

  return (
    <div className={`skill-assessment-onboarding ${className}`}>
      <div className="max-w-4xl mx-auto">
        {step === 'categories' && renderCategorySelection()}
        {step === 'assessment' && renderAssessment()}
        {step === 'review' && renderReview()}
      </div>
    </div>
  );
};

// Individual category assessment component
interface SkillCategoryAssessmentProps {
  category: SkillCategory;
  onSubmit: (assessment: SkillAssessment) => void;
  progress: { current: number; total: number };
}

const SkillCategoryAssessment: React.FC<SkillCategoryAssessmentProps> = ({
  category,
  onSubmit,
  progress
}) => {
  const [current, setCurrent] = useState(5);
  const [target, setTarget] = useState(7);
  const [importance, setImportance] = useState(3);
  const [experience, setExperience] = useState('intermediate');

  const handleSubmit = () => {
    const assessment: SkillAssessment = {
      category: category.name,
      current,
      target,
      importance,
      experience
    };
    onSubmit(assessment);
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">
          Step {progress.current} of {progress.total}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Category header */}
      <div className="text-center">
        <div className="text-4xl mb-2">{category.icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {category.name}
        </h3>
        <p className="text-gray-600">{category.description}</p>
      </div>

      {/* Assessment form */}
      <div className="space-y-6">
        {/* Experience level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Experience Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setExperience(level.value)}
                className={`p-3 text-center rounded-lg border transition-all ${
                  experience === level.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-xs text-gray-500">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current skill level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Current Skill Level: {current}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={current}
            onChange={(e) => setCurrent(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Beginner</span>
            <span>Expert</span>
          </div>
        </div>

        {/* Target skill level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Target Skill Level: {target}/10
          </label>
          <input
            type="range"
            min={current}
            max="10"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-500 mt-1">
            Gap: {target - current} levels
          </div>
        </div>

        {/* Importance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Importance for Your Goals
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setImportance(level)}
                className={`w-8 h-8 rounded-full transition-all ${
                  level <= importance
                    ? 'bg-yellow-400 text-white'
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {progress.current === progress.total ? 'Finish' : 'Next Category'}
        </button>
      </div>
    </div>
  );
};
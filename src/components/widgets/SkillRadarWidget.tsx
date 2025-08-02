import React, { useEffect, useState, useCallback } from 'react';
import { useWidgetState } from '../../hooks/useWidgetState';
import { usePersonalizedSkillGapAnalysis } from '../../hooks/useMCP';
import { SkillRadarChart } from './skills/SkillRadarChart';
import { SkillAssessmentOnboarding } from './skills/SkillAssessmentOnboarding';
import { terminalLogger } from '../../utils/terminalLogger';

interface SkillRadarWidgetProps {
  widgetId: string;
  className?: string;
}

interface SkillData {
  category: string;
  current: number;
  target: number;
  importance: number;
  trending: 'up' | 'down' | 'stable';
  subSkills?: Array<{
    name: string;
    level: number;
    experience: string;
  }>;
}

interface SkillAssessment {
  category: string;
  current: number;
  target: number;
  importance: number;
  experience: string;
}

type ViewMode = 'chart' | 'onboarding' | 'gaps' | 'progress';

export const SkillRadarWidget: React.FC<SkillRadarWidgetProps> = ({
  widgetId,
  className = ''
}) => {
  const { isLoading, error, data, updateData } = useWidgetState(widgetId);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  
  // Use live MCP integration
  const { 
    data: skillGapAnalysis, 
    loading: mcpLoading, 
    error: mcpError
  } = usePersonalizedSkillGapAnalysis('testuser', 'fullstack-developer');

  useEffect(() => {
    // Check if user has existing skill data
    const existingData = data?.skills as SkillData[] | undefined;
    if (existingData && existingData.length > 0) {
      setSkillData(existingData);
      setHasCompletedAssessment(true);
      terminalLogger.info('SkillRadarWidget', 'Loaded existing skill data', {
        widgetId,
        skillCount: existingData.length
      });
    } else if (skillGapAnalysis) {
      // Use live MCP data
      const liveSkillData = transformMCPToSkillData(skillGapAnalysis);
      setSkillData(liveSkillData);
      setHasCompletedAssessment(true);
      updateData({ skills: liveSkillData });
      
      terminalLogger.info('SkillRadarWidget', 'Live MCP skill data loaded', {
        widgetId,
        skillCount: liveSkillData.length,
        mcpData: skillGapAnalysis,
        dataSource: 'live-mcp'
      });
    } else if (!mcpLoading && !skillGapAnalysis) {
      // Fallback to assessment flow if no MCP data
      setHasCompletedAssessment(false);
      setViewMode('onboarding');
      
      terminalLogger.warn('SkillRadarWidget', 'No MCP data available, using assessment flow', {
        widgetId,
        mcpError: mcpError
      });
    }
  }, [data, skillGapAnalysis, mcpLoading, mcpError, widgetId, updateData]);

  const handleAssessmentComplete = useCallback((assessments: SkillAssessment[]) => {
    const newSkillData: SkillData[] = assessments.map(assessment => ({
      category: assessment.category,
      current: assessment.current,
      target: assessment.target,
      importance: assessment.importance,
      trending: 'stable' as const,
      subSkills: generateSubSkills(assessment.category, assessment.current)
    }));

    setSkillData(newSkillData);
    setHasCompletedAssessment(true);
    setViewMode('chart');
    updateData({ skills: newSkillData });

    terminalLogger.info('SkillRadarWidget', 'Assessment completed', {
      widgetId,
      assessmentCount: assessments.length,
      categories: assessments.map(a => a.category)
    });
  }, [widgetId, updateData]);

  const handleSkillClick = useCallback((skill: SkillData) => {
    terminalLogger.info('SkillRadarWidget', 'Skill clicked for details', {
      widgetId,
      category: skill.category,
      gap: skill.target - skill.current
    });
  }, [widgetId]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    terminalLogger.info('SkillRadarWidget', 'View mode changed', {
      widgetId,
      previousMode: viewMode,
      newMode: mode
    });
  }, [viewMode, widgetId]);

  const getSkillGaps = useCallback(() => {
    return skillData
      .map(skill => ({
        ...skill,
        gap: skill.target - skill.current
      }))
      .sort((a, b) => b.gap - a.gap)
      .filter(skill => skill.gap > 0);
  }, [skillData]);

  const getSkillProgress = useCallback(() => {
    return skillData.map(skill => ({
      ...skill,
      progress: (skill.current / skill.target) * 100,
      gap: skill.target - skill.current
    }));
  }, [skillData]);

  if (error) {
    return (
      <div className={`skill-radar-widget ${className} p-4`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm font-medium">Failed to load skill data</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading || mcpLoading) {
    return (
      <div className={`skill-radar-widget ${className} p-4`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`skill-radar-widget ${className} bg-white rounded-lg border border-gray-200 shadow-sm`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Skill Assessment
            </h3>
            <div className="text-sm text-gray-500">
              {skillData.length} categories • {getSkillGaps().length} gaps identified
            </div>
          </div>
          <button
            onClick={() => setViewMode('onboarding')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Retake assessment"
          >
            ⚙️
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'chart', label: 'Radar Chart', icon: '🎯' },
            { key: 'gaps', label: 'Skill Gaps', icon: '📊' },
            { key: 'progress', label: 'Progress', icon: '📈' },
            { key: 'onboarding', label: 'Assessment', icon: '📝' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleViewModeChange(key as ViewMode)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                viewMode === key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'chart' && hasCompletedAssessment && (
          <SkillRadarChart
            data={skillData}
            width={500}
            height={400}
            showTargetLayer={true}
            showSubSkills={true}
            onSkillClick={handleSkillClick}
          />
        )}

        {viewMode === 'gaps' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Skill Gap Analysis
              </h4>
              <p className="text-sm text-gray-600">
                Focus on these areas to reach your target skill levels
              </p>
            </div>

            {getSkillGaps().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-lg font-medium text-gray-900 mb-1">
                  No skill gaps identified!
                </div>
                <div className="text-sm text-gray-600">
                  You've reached your target levels in all assessed areas.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {getSkillGaps().map((skill, index) => (
                  <div
                    key={skill.category}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{skill.category}</h5>
                          <div className="text-sm text-gray-600">
                            Gap: {skill.gap.toFixed(1)} levels
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Priority</div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(level => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                level <= skill.importance ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Current Level</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(skill.current / 10) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{skill.current}/10</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Target Level</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(skill.target / 10) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{skill.target}/10</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        Recommended action: Focus on practical projects and structured learning
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'progress' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Skill Progress Overview
              </h4>
              <p className="text-sm text-gray-600">
                Track your progress towards target skill levels
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getSkillProgress().map((skill) => (
                <div
                  key={skill.category}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">{skill.category}</h5>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      skill.progress >= 100 
                        ? 'bg-green-100 text-green-800'
                        : skill.progress >= 75
                        ? 'bg-blue-100 text-blue-800'
                        : skill.progress >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {skill.progress.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          skill.progress >= 100 
                            ? 'bg-green-500'
                            : skill.progress >= 75
                            ? 'bg-blue-500'
                            : skill.progress >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(skill.progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Current: {skill.current}/10</span>
                    <span>Target: {skill.target}/10</span>
                  </div>

                  {skill.gap > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {skill.gap.toFixed(1)} levels to go
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'onboarding' && (
          <SkillAssessmentOnboarding
            onComplete={handleAssessmentComplete}
            onSkip={() => setViewMode('chart')}
          />
        )}
      </div>
    </div>
  );
};

// Transform MCP skill gap response to SkillData format
function transformMCPToSkillData(mcpResponse: any): SkillData[] {
  const skillCategories: Record<string, SkillData> = {};
  
  // Process current skills (from GitHub analysis)
  if (mcpResponse.currentSkills) {
    mcpResponse.currentSkills.forEach((skill: string) => {
      const category = categorizeSkill(skill);
      if (!skillCategories[category]) {
        skillCategories[category] = {
          category,
          current: 0,
          target: 8,
          importance: 3,
          trending: 'stable' as const,
          subSkills: []
        };
      }
      skillCategories[category].current = Math.max(skillCategories[category].current, 7);
      skillCategories[category].subSkills?.push({
        name: skill,
        level: 7,
        experience: 'Advanced'
      });
    });
  }
  
  // Process missing skills (skill gaps)
  if (mcpResponse.missingSkills) {
    mcpResponse.missingSkills.forEach((skillGap: any) => {
      const category = categorizeSkill(skillGap.skill || skillGap.name || skillGap);
      if (!skillCategories[category]) {
        skillCategories[category] = {
          category,
          current: 2,
          target: 8,
          importance: skillGap.priority === 'High' ? 5 : skillGap.priority === 'Medium' ? 3 : 2,
          trending: 'up' as const,
          subSkills: []
        };
      }
      
      const skillName = skillGap.skill || skillGap.name || skillGap;
      skillCategories[category].subSkills?.push({
        name: skillName,
        level: 2,
        experience: 'Beginner'
      });
    });
  }
  
  return Object.values(skillCategories);
}

function categorizeSkill(skill: string): string {
  const skillLower = skill.toLowerCase();
  
  if (['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'frontend'].some(s => skillLower.includes(s))) {
    return 'Frontend Development';
  }
  if (['node', 'express', 'python', 'java', 'backend', 'api', 'server'].some(s => skillLower.includes(s))) {
    return 'Backend Development';
  }
  if (['sql', 'mongodb', 'postgresql', 'database', 'redis'].some(s => skillLower.includes(s))) {
    return 'Database & Storage';
  }
  if (['docker', 'kubernetes', 'aws', 'devops', 'ci/cd', 'deployment'].some(s => skillLower.includes(s))) {
    return 'DevOps & Infrastructure';
  }
  if (['react native', 'flutter', 'swift', 'kotlin', 'mobile'].some(s => skillLower.includes(s))) {
    return 'Mobile Development';
  }
  if (['python', 'tensorflow', 'pytorch', 'data', 'ml', 'ai'].some(s => skillLower.includes(s))) {
    return 'Data Science & ML';
  }
  
  return 'General Skills';
}

function generateSubSkills(category: string, currentLevel: number) {
  const skillMap: Record<string, string[]> = {
    'Frontend Development': ['React', 'Vue.js', 'Angular', 'TypeScript', 'CSS'],
    'Backend Development': ['Node.js', 'Python', 'Java', 'API Design', 'Microservices'],
    'Database & Storage': ['PostgreSQL', 'MongoDB', 'Redis', 'SQL', 'NoSQL'],
    'DevOps & Infrastructure': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform'],
    'Mobile Development': ['React Native', 'Flutter', 'Swift', 'Kotlin'],
    'Data Science & ML': ['Python', 'R', 'TensorFlow', 'PyTorch', 'Pandas']
  };

  const skills = skillMap[category] || ['Skill 1', 'Skill 2', 'Skill 3'];
  
  return skills.slice(0, 3).map(skill => ({
    name: skill,
    level: Math.max(1, currentLevel + Math.floor(Math.random() * 3) - 1),
    experience: currentLevel >= 7 ? 'Advanced' : currentLevel >= 4 ? 'Intermediate' : 'Beginner'
  }));
}
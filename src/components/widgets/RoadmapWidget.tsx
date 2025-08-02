import React, { useEffect, useState, useCallback } from 'react';
import { useWidgetState } from '../../hooks/useWidgetState';
import { usePersonalizedLearningRoadmap } from '../../hooks/useMCP';
import { RoadmapKanbanBoard, Milestone } from './roadmap/RoadmapKanbanBoard';
import { terminalLogger } from '../../utils/terminalLogger';

interface RoadmapWidgetProps {
  widgetId: string;
  targetRole?: string;
  currentSkills?: string[];
  className?: string;
}

interface RoadmapData {
  milestones: Milestone[];
  targetRole: string;
  currentSkills: string[];
  completedMilestones: number;
  totalEstimatedHours: number;
  actualHours: number;
}

type ViewMode = 'board' | 'templates' | 'analytics' | 'settings';

export const RoadmapWidget: React.FC<RoadmapWidgetProps> = ({
  widgetId,
  targetRole = 'fullstack-developer',
  currentSkills = [],
  className = ''
}) => {
  const { isLoading, error, data, updateData } = useWidgetState(widgetId);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  
  // Use live MCP integration for roadmap data
  const { 
    data: mcpRoadmapData, 
    loading: mcpLoading, 
    error: mcpError, 
    refetch: refetchRoadmap 
  } = usePersonalizedLearningRoadmap(targetRole, currentSkills);

  useEffect(() => {
    // Load existing roadmap data or create from live MCP data
    const existingData = data?.roadmap as RoadmapData | undefined;
    if (existingData && existingData.milestones.length > 0) {
      setRoadmapData(existingData);
      terminalLogger.info('RoadmapWidget', 'Loaded existing roadmap data', {
        widgetId,
        milestoneCount: existingData.milestones.length,
        targetRole: existingData.targetRole
      });
    } else if (mcpRoadmapData) {
      // Transform live MCP data to roadmap format
      const liveRoadmapData = transformMCPToRoadmapData(mcpRoadmapData, targetRole, currentSkills);
      setRoadmapData(liveRoadmapData);
      updateData({ roadmap: liveRoadmapData });
      
      terminalLogger.info('RoadmapWidget', 'Live MCP roadmap data loaded', {
        widgetId,
        milestoneCount: liveRoadmapData.milestones.length,
        targetRole: liveRoadmapData.targetRole,
        mcpData: mcpRoadmapData,
        dataSource: 'live-mcp'
      });
    } else if (!mcpLoading && !mcpRoadmapData) {
      // Fallback to empty roadmap if no MCP data
      const emptyRoadmap: RoadmapData = {
        milestones: [],
        targetRole,
        currentSkills,
        completedMilestones: 0,
        totalEstimatedHours: 0,
        actualHours: 0
      };
      setRoadmapData(emptyRoadmap);
      
      terminalLogger.warn('RoadmapWidget', 'No MCP roadmap data available, using empty roadmap', {
        widgetId,
        mcpError: mcpError,
        targetRole
      });
    }
  }, [data, mcpRoadmapData, mcpLoading, mcpError, widgetId, updateData, targetRole, currentSkills]);

  const handleMilestoneUpdate = useCallback((updatedMilestone: Milestone) => {
    if (!roadmapData) return;

    const updatedMilestones = roadmapData.milestones.map(milestone =>
      milestone.id === updatedMilestone.id ? updatedMilestone : milestone
    );

    const newRoadmapData = {
      ...roadmapData,
      milestones: updatedMilestones,
      completedMilestones: updatedMilestones.filter(m => m.status === 'completed').length,
      actualHours: updatedMilestones.reduce((sum, m) => sum + (m.actualHours || 0), 0)
    };

    setRoadmapData(newRoadmapData);
    updateData({ roadmap: newRoadmapData });

    terminalLogger.info('RoadmapWidget', 'Milestone updated', {
      widgetId,
      milestoneId: updatedMilestone.id,
      title: updatedMilestone.title,
      progress: updatedMilestone.progress,
      status: updatedMilestone.status
    });
  }, [roadmapData, widgetId, updateData]);

  const handleMilestoneMove = useCallback((milestoneId: string, newStatus: Milestone['status']) => {
    if (!roadmapData) return;

    const updatedMilestones = roadmapData.milestones.map(milestone => {
      if (milestone.id === milestoneId) {
        const updatedMilestone = { ...milestone, status: newStatus };
        
        // Auto-update progress based on status
        if (newStatus === 'completed' && milestone.progress < 100) {
          updatedMilestone.progress = 100;
          updatedMilestone.completedDate = new Date().toISOString();
        } else if (newStatus === 'in-progress' && milestone.progress === 0) {
          updatedMilestone.progress = 25;
        }
        
        return updatedMilestone;
      }
      return milestone;
    });

    const newRoadmapData = {
      ...roadmapData,
      milestones: updatedMilestones,
      completedMilestones: updatedMilestones.filter(m => m.status === 'completed').length
    };

    setRoadmapData(newRoadmapData);
    updateData({ roadmap: newRoadmapData });

    terminalLogger.info('RoadmapWidget', 'Milestone moved', {
      widgetId,
      milestoneId,
      newStatus,
      totalCompleted: newRoadmapData.completedMilestones
    });
  }, [roadmapData, widgetId, updateData]);

  const handleMilestoneCreate = useCallback((columnId: string) => {
    if (!roadmapData) return;

    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: 'New Milestone',
      description: 'Add description...',
      status: columnId as Milestone['status'],
      priority: 'medium',
      difficulty: 3,
      estimatedHours: 10,
      skills: [],
      prerequisites: [],
      resources: [],
      progress: 0,
      tags: [],
      category: 'Custom'
    };

    const updatedMilestones = [...roadmapData.milestones, newMilestone];
    const newRoadmapData = {
      ...roadmapData,
      milestones: updatedMilestones,
      totalEstimatedHours: updatedMilestones.reduce((sum, m) => sum + m.estimatedHours, 0)
    };

    setRoadmapData(newRoadmapData);
    updateData({ roadmap: newRoadmapData });

    terminalLogger.info('RoadmapWidget', 'New milestone created', {
      widgetId,
      milestoneId: newMilestone.id,
      status: columnId
    });
  }, [roadmapData, widgetId, updateData]);

  const handleRefreshRoadmap = useCallback(async () => {
    try {
      terminalLogger.info('RoadmapWidget', 'Refreshing roadmap from MCP', {
        widgetId,
        targetRole,
        currentSkills
      });
      
      await refetchRoadmap();
    } catch (error) {
      terminalLogger.error('RoadmapWidget', 'Failed to refresh roadmap', {
        widgetId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [widgetId, targetRole, currentSkills, refetchRoadmap]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    terminalLogger.info('RoadmapWidget', 'View mode changed', {
      widgetId,
      previousMode: viewMode,
      newMode: mode
    });
  }, [viewMode, widgetId]);

  const getProgressStats = useCallback(() => {
    if (!roadmapData) return { completion: 0, onTrack: 0, overdue: 0 };

    const total = roadmapData.milestones.length;
    const completed = roadmapData.completedMilestones;
    const completion = total > 0 ? (completed / total) * 100 : 0;

    const now = new Date();
    const overdue = roadmapData.milestones.filter(m => 
      m.dueDate && new Date(m.dueDate) < now && m.status !== 'completed'
    ).length;

    const onTrack = roadmapData.milestones.filter(m => 
      m.status === 'in-progress' && (!m.dueDate || new Date(m.dueDate) >= now)
    ).length;

    return { completion, onTrack, overdue };
  }, [roadmapData]);

  if (error) {
    return (
      <div className={`roadmap-widget ${className} p-4`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm font-medium">Failed to load roadmap data</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading || mcpLoading || !roadmapData) {
    return (
      <div className={`roadmap-widget ${className} p-4`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 h-64">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progressStats = getProgressStats();

  return (
    <div className={`roadmap-widget ${className} bg-white rounded-lg border border-gray-200 shadow-sm`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Learning Roadmap
            </h3>
            <div className="text-sm text-gray-500">
              {roadmapData.targetRole.replace('-', ' ')} • {roadmapData.milestones.length} milestones • {progressStats.completion.toFixed(0)}% complete
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">
              {roadmapData.totalEstimatedHours}h estimated
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'board', label: 'Kanban Board', icon: '📋' },
            { key: 'templates', label: 'Templates', icon: '📚' },
            { key: 'analytics', label: 'Analytics', icon: '📊' },
            { key: 'settings', label: 'Settings', icon: '⚙️' }
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
        {viewMode === 'board' && (
          <RoadmapKanbanBoard
            milestones={roadmapData.milestones}
            onMilestoneUpdate={handleMilestoneUpdate}
            onMilestoneMove={handleMilestoneMove}
            onMilestoneCreate={handleMilestoneCreate}
          />
        )}

        {viewMode === 'templates' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                AI-Generated Roadmap
              </h4>
              <p className="text-sm text-gray-600">
                Your personalized learning roadmap powered by live MCP analysis
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-600">🤖</span>
                <span className="font-medium text-blue-900">Live MCP Integration</span>
              </div>
              <p className="text-sm text-blue-800">
                This roadmap is dynamically generated based on your current skills, target role, and real-time analysis.
                No hardcoded templates - everything is personalized for you.
              </p>
              <button
                onClick={handleRefreshRoadmap}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                🔄 Refresh Roadmap
              </button>
            </div>

            {mcpRoadmapData && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">MCP Response Data</h5>
                <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                  {JSON.stringify(mcpRoadmapData, null, 2)}
                </pre>
              </div>
            )}

            {mcpError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="font-medium text-red-900">MCP Error</span>
                </div>
                <p className="text-sm text-red-800">{mcpError}</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Progress Analytics
              </h4>
              <p className="text-sm text-gray-600">
                Track your learning progress and identify areas for improvement
              </p>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {progressStats.completion.toFixed(0)}%
                </div>
                <div className="text-sm text-green-600">Overall Completion</div>
                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressStats.completion}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {progressStats.onTrack}
                </div>
                <div className="text-sm text-blue-600">On Track</div>
                <div className="text-xs text-gray-500 mt-1">
                  Milestones in progress
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {progressStats.overdue}
                </div>
                <div className="text-sm text-red-600">Overdue</div>
                <div className="text-xs text-gray-500 mt-1">
                  Need attention
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Progress by Category</h5>
              {Object.entries(
                roadmapData.milestones.reduce((acc, milestone) => {
                  if (!acc[milestone.category]) {
                    acc[milestone.category] = { total: 0, completed: 0, hours: 0 };
                  }
                  acc[milestone.category].total++;
                  if (milestone.status === 'completed') {
                    acc[milestone.category].completed++;
                  }
                  acc[milestone.category].hours += milestone.estimatedHours;
                  return acc;
                }, {} as Record<string, { total: number; completed: number; hours: number }>)
              ).map(([category, stats]) => {
                const percentage = (stats.completed / stats.total) * 100;
                return (
                  <div key={category} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{category}</span>
                      <span className="text-sm text-gray-600">
                        {stats.completed}/{stats.total} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stats.hours} hours estimated
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'settings' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Roadmap Settings
              </h4>
              <p className="text-sm text-gray-600">
                Customize your learning roadmap preferences
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Role
                </label>
                <select
                  value={roadmapData.targetRole}
                  onChange={(e) => {
                    const newRoadmapData = { ...roadmapData, targetRole: e.target.value };
                    setRoadmapData(newRoadmapData);
                    updateData({ roadmap: newRoadmapData });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="frontend-developer">Frontend Developer</option>
                  <option value="backend-developer">Backend Developer</option>
                  <option value="fullstack-developer">Full Stack Developer</option>
                  <option value="data-scientist">Data Scientist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Skills
                </label>
                <div className="text-sm text-gray-600">
                  Skills are automatically detected from your GitHub activity and skill assessments.
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roadmapData.currentSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Roadmap Statistics</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Milestones</div>
                    <div className="font-medium">{roadmapData.milestones.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Estimated Hours</div>
                    <div className="font-medium">{roadmapData.totalEstimatedHours}h</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Completed</div>
                    <div className="font-medium">{roadmapData.completedMilestones}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Actual Hours</div>
                    <div className="font-medium">{roadmapData.actualHours}h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Transform MCP roadmap response to RoadmapData format
function transformMCPToRoadmapData(mcpData: any, targetRole: string, currentSkills: string[]): RoadmapData {
  const milestones: Milestone[] = [];
  
  // Process MCP roadmap data - structure depends on MCP server response
  if (mcpData.milestones) {
    mcpData.milestones.forEach((mcpMilestone: any, index: number) => {
      const milestone: Milestone = {
        id: `mcp-milestone-${index + 1}`,
        title: mcpMilestone.title || mcpMilestone.name || `Learning Milestone ${index + 1}`,
        description: mcpMilestone.description || 'AI-generated learning milestone',
        status: index === 0 ? 'in-progress' : 'backlog',
        priority: mcpMilestone.priority || 'medium',
        difficulty: mcpMilestone.difficulty || 3,
        estimatedHours: mcpMilestone.estimatedHours || mcpMilestone.duration || 20,
        skills: mcpMilestone.skills || [],
        prerequisites: mcpMilestone.prerequisites || [],
        resources: mcpMilestone.resources || [],
        progress: index === 0 ? 25 : 0,
        tags: mcpMilestone.tags || [targetRole],
        category: mcpMilestone.category || 'AI Generated',
        dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      milestones.push(milestone);
    });
  } else if (mcpData.learningPath) {
    // Alternative structure - learning path
    mcpData.learningPath.forEach((step: any, index: number) => {
      const milestone: Milestone = {
        id: `mcp-step-${index + 1}`,
        title: step.title || `Learning Step ${index + 1}`,
        description: step.description || 'AI-generated learning step',
        status: 'backlog',
        priority: 'medium',
        difficulty: 3,
        estimatedHours: step.hours || 15,
        skills: step.skills || [],
        prerequisites: [],
        resources: step.resources || [],
        progress: 0,
        tags: [targetRole],
        category: 'Learning Path'
      };
      milestones.push(milestone);
    });
  } else {
    // Fallback: create milestones from any structured data
    const keys = Object.keys(mcpData);
    keys.forEach((key, index) => {
      if (typeof mcpData[key] === 'object' && mcpData[key] !== null) {
        const milestone: Milestone = {
          id: `mcp-generated-${index + 1}`,
          title: `${key.charAt(0).toUpperCase() + key.slice(1)} Learning`,
          description: `AI-generated milestone for ${key}`,
          status: 'backlog',
          priority: 'medium',
          difficulty: 3,
          estimatedHours: 20,
          skills: Array.isArray(mcpData[key]) ? mcpData[key] : [],
          prerequisites: [],
          resources: [],
          progress: 0,
          tags: [targetRole],
          category: 'AI Generated'
        };
        milestones.push(milestone);
      }
    });
  }

  return {
    milestones,
    targetRole,
    currentSkills,
    completedMilestones: milestones.filter(m => m.status === 'completed').length,
    totalEstimatedHours: milestones.reduce((sum, m) => sum + m.estimatedHours, 0),
    actualHours: 0
  };
}
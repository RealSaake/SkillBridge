import React, { useState, useCallback } from 'react';
import { Milestone } from './RoadmapKanbanBoard';
import { terminalLogger } from '../../../utils/terminalLogger';

interface MilestoneCardProps {
  milestone: Milestone;
  onUpdate: (milestone: Milestone) => void;
  onClick: (milestone: Milestone) => void;
  isDragging?: boolean;
  isBeingDragged?: boolean;
  className?: string;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  medium: 'bg-blue-100 text-blue-700 border-blue-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  critical: 'bg-red-100 text-red-700 border-red-300'
};

const PRIORITY_ICONS = {
  low: '⬇️',
  medium: '➡️',
  high: '⬆️',
  critical: '🔥'
};

const DIFFICULTY_COLORS = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700'
};

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onUpdate,
  onClick,
  isDragging = false,
  isBeingDragged = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleProgressUpdate = useCallback((newProgress: number) => {
    const updatedMilestone = { ...milestone, progress: newProgress };
    onUpdate(updatedMilestone);
    
    terminalLogger.info('MilestoneCard', 'Progress updated', {
      milestoneId: milestone.id,
      oldProgress: milestone.progress,
      newProgress,
      title: milestone.title
    });
  }, [milestone, onUpdate]);

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    
    terminalLogger.debug('MilestoneCard', 'Card expansion toggled', {
      milestoneId: milestone.id,
      isExpanded: !isExpanded
    });
  }, [isExpanded, milestone.id]);

  const formatDuration = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const getDaysUntilDue = (): number | null => {
    if (!milestone.dueDate) return null;
    const due = new Date(milestone.dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (): boolean => {
    const daysUntilDue = getDaysUntilDue();
    return daysUntilDue !== null && daysUntilDue < 0;
  };

  const isUpcoming = (): boolean => {
    const daysUntilDue = getDaysUntilDue();
    return daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
  };

  return (
    <div
      className={`milestone-card bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
      } ${
        isBeingDragged ? 'opacity-50' : ''
      } ${
        isOverdue() ? 'border-red-300 bg-red-50' : ''
      } ${
        isUpcoming() ? 'border-yellow-300 bg-yellow-50' : ''
      } ${className}`}
      onClick={() => onClick(milestone)}
    >
      {/* Card Header */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h6 className="font-medium text-gray-900 text-sm truncate">
              {milestone.title}
            </h6>
            <div className="text-xs text-gray-500 mt-1">
              {milestone.category}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {/* Priority indicator */}
            <span
              className={`px-1.5 py-0.5 text-xs rounded border ${PRIORITY_COLORS[milestone.priority]}`}
              title={`Priority: ${milestone.priority}`}
            >
              {PRIORITY_ICONS[milestone.priority]}
            </span>
            
            {/* Difficulty indicator */}
            <span
              className={`px-1.5 py-0.5 text-xs rounded ${DIFFICULTY_COLORS[milestone.difficulty]}`}
              title={`Difficulty: ${milestone.difficulty}/5`}
            >
              {milestone.difficulty}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{milestone.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                milestone.progress === 100
                  ? 'bg-green-500'
                  : milestone.progress >= 75
                  ? 'bg-blue-500'
                  : milestone.progress >= 50
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
              }`}
              style={{ width: `${milestone.progress}%` }}
            />
          </div>
        </div>

        {/* Quick info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span title="Estimated hours">
              ⏱️ {formatDuration(milestone.estimatedHours)}
            </span>
            {milestone.skills.length > 0 && (
              <span title="Skills">
                🎯 {milestone.skills.length}
              </span>
            )}
          </div>
          
          {milestone.dueDate && (
            <div className={`flex items-center space-x-1 ${
              isOverdue() ? 'text-red-600' : isUpcoming() ? 'text-yellow-600' : ''
            }`}>
              <span>📅</span>
              <span>
                {getDaysUntilDue() === 0 ? 'Today' :
                 getDaysUntilDue() === 1 ? 'Tomorrow' :
                 getDaysUntilDue() && getDaysUntilDue()! < 0 ? `${Math.abs(getDaysUntilDue()!)}d overdue` :
                 `${getDaysUntilDue()}d`}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {milestone.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {milestone.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {milestone.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-gray-400">
                +{milestone.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          {/* Description */}
          {milestone.description && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Description</div>
              <div className="text-xs text-gray-600">{milestone.description}</div>
            </div>
          )}

          {/* Skills */}
          {milestone.skills.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Skills</div>
              <div className="flex flex-wrap gap-1">
                {milestone.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {milestone.prerequisites.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Prerequisites</div>
              <div className="space-y-1">
                {milestone.prerequisites.map((prereq, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {prereq}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {milestone.resources.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Resources</div>
              <div className="space-y-1">
                {milestone.resources.slice(0, 3).map((resource, index) => (
                  <div key={index} className="text-xs">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="mr-1">
                        {resource.type === 'course' && '📚'}
                        {resource.type === 'article' && '📄'}
                        {resource.type === 'video' && '🎥'}
                        {resource.type === 'book' && '📖'}
                        {resource.type === 'project' && '🛠️'}
                      </span>
                      <span className="truncate">{resource.title}</span>
                      {resource.duration && (
                        <span className="ml-1 text-gray-500">({resource.duration})</span>
                      )}
                    </a>
                  </div>
                ))}
                {milestone.resources.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{milestone.resources.length - 3} more resources
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {/* Progress quick update */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressUpdate(Math.max(0, milestone.progress - 25));
                  }}
                  className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                  disabled={milestone.progress === 0}
                >
                  -
                </button>
                <span className="text-xs text-gray-600 w-8 text-center">
                  {milestone.progress}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressUpdate(Math.min(100, milestone.progress + 25));
                  }}
                  className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                  disabled={milestone.progress === 100}
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {milestone.actualHours ? `${milestone.actualHours}h actual` : 'No time logged'}
            </div>
          </div>
        </div>
      )}

      {/* Expand/collapse button */}
      <button
        onClick={toggleExpanded}
        className="w-full py-1 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 hover:bg-gray-50"
      >
        {isExpanded ? '▲ Less' : '▼ More'}
      </button>
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { MilestoneCard } from './MilestoneCard';
import { terminalLogger } from '../../../utils/terminalLogger';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  actualHours?: number;
  skills: string[];
  prerequisites: string[];
  resources: Array<{
    type: 'course' | 'article' | 'video' | 'book' | 'project';
    title: string;
    url: string;
    duration?: string;
  }>;
  progress: number;
  dueDate?: string;
  completedDate?: string;
  tags: string[];
  category: string;
}

interface Column {
  id: string;
  title: string;
  milestones: Milestone[];
  limit?: number;
  color: string;
}

interface RoadmapKanbanBoardProps {
  milestones: Milestone[];
  onMilestoneUpdate: (milestone: Milestone) => void;
  onMilestoneMove: (milestoneId: string, newStatus: Milestone['status']) => void;
  onMilestoneCreate: (column: string) => void;
  className?: string;
}

const COLUMN_CONFIG: Omit<Column, 'milestones'>[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: 'bg-gray-100 border-gray-300',
    limit: undefined
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-blue-100 border-blue-300',
    limit: 3
  },
  {
    id: 'review',
    title: 'Review',
    color: 'bg-yellow-100 border-yellow-300',
    limit: 5
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-green-100 border-green-300',
    limit: undefined
  }
];

export const RoadmapKanbanBoard: React.FC<RoadmapKanbanBoardProps> = ({
  milestones,
  onMilestoneUpdate,
  onMilestoneMove,
  onMilestoneCreate,
  className = ''
}) => {
  const [draggedMilestone, setDraggedMilestone] = useState<string | null>(null);

  // Group milestones by status
  const columns: Column[] = COLUMN_CONFIG.map(config => ({
    ...config,
    milestones: milestones.filter(milestone => milestone.status === config.id)
  }));

  const handleDragStart = useCallback((start: any) => {
    setDraggedMilestone(start.draggableId);
    terminalLogger.info('RoadmapKanbanBoard', 'Milestone drag started', {
      milestoneId: start.draggableId,
      sourceColumn: start.source.droppableId
    });
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    setDraggedMilestone(null);

    if (!result.destination) {
      terminalLogger.debug('RoadmapKanbanBoard', 'Drag cancelled - no destination');
      return;
    }

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      terminalLogger.debug('RoadmapKanbanBoard', 'Drag cancelled - same position');
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      terminalLogger.error('RoadmapKanbanBoard', 'Invalid column in drag operation', {
        sourceId: source.droppableId,
        destId: destination.droppableId
      });
      return;
    }

    // Check column limits
    if (destColumn.limit && destColumn.milestones.length >= destColumn.limit && source.droppableId !== destination.droppableId) {
      terminalLogger.warn('RoadmapKanbanBoard', 'Column limit exceeded', {
        columnId: destColumn.id,
        limit: destColumn.limit,
        currentCount: destColumn.milestones.length
      });
      // You could show a toast notification here
      return;
    }

    terminalLogger.info('RoadmapKanbanBoard', 'Milestone moved', {
      milestoneId: draggableId,
      from: source.droppableId,
      to: destination.droppableId,
      fromIndex: source.index,
      toIndex: destination.index
    });

    onMilestoneMove(draggableId, destination.droppableId as Milestone['status']);
  }, [columns, onMilestoneMove]);

  const handleMilestoneClick = useCallback((milestone: Milestone) => {
    terminalLogger.info('RoadmapKanbanBoard', 'Milestone clicked for details', {
      milestoneId: milestone.id,
      title: milestone.title,
      status: milestone.status
    });
  }, []);

  const getColumnStats = useCallback((column: Column) => {
    const totalHours = column.milestones.reduce((sum, m) => sum + m.estimatedHours, 0);
    const completedHours = column.milestones.reduce((sum, m) => sum + (m.actualHours || 0), 0);
    const avgProgress = column.milestones.length > 0 
      ? column.milestones.reduce((sum, m) => sum + m.progress, 0) / column.milestones.length 
      : 0;

    return { totalHours, completedHours, avgProgress };
  }, []);

  return (
    <div className={`roadmap-kanban-board ${className}`}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Roadmap</h4>
        <div className="text-xs text-gray-500">
          {milestones.length} milestones • Drag to reorganize
        </div>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
          {columns.map((column) => {
            const stats = getColumnStats(column);
            const isOverLimit = column.limit && column.milestones.length > column.limit;

            return (
              <div key={column.id} className="flex flex-col h-full">
                {/* Column Header */}
                <div className={`p-3 rounded-t-lg border-2 ${column.color} ${isOverLimit ? 'border-red-400' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{column.title}</h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {column.milestones.length}
                        {column.limit && `/${column.limit}`}
                      </span>
                      <button
                        onClick={() => onMilestoneCreate(column.id)}
                        className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                        title="Add milestone"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Column Stats */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Est. Hours:</span>
                      <span>{stats.totalHours}h</span>
                    </div>
                    {column.id !== 'backlog' && (
                      <div className="flex justify-between">
                        <span>Avg Progress:</span>
                        <span>{stats.avgProgress.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>

                  {isOverLimit && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      ⚠️ Over limit ({column.milestones.length}/{column.limit})
                    </div>
                  )}
                </div>

                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 border-2 border-t-0 rounded-b-lg min-h-32 ${
                        column.color
                      } ${
                        snapshot.isDraggingOver ? 'bg-opacity-50' : ''
                      } ${
                        isOverLimit ? 'border-red-400' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        {column.milestones.map((milestone, index) => (
                          <Draggable
                            key={milestone.id}
                            draggableId={milestone.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                } transition-transform`}
                              >
                                <MilestoneCard
                                  milestone={milestone}
                                  onUpdate={onMilestoneUpdate}
                                  onClick={() => handleMilestoneClick(milestone)}
                                  isDragging={snapshot.isDragging}
                                  isBeingDragged={draggedMilestone === milestone.id}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>

                      {/* Empty state */}
                      {column.milestones.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                          <div className="text-center">
                            <div className="text-2xl mb-1">
                              {column.id === 'backlog' && '📋'}
                              {column.id === 'in-progress' && '⚡'}
                              {column.id === 'review' && '👀'}
                              {column.id === 'completed' && '✅'}
                            </div>
                            <div>Drop milestones here</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Board Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-gray-900">
              {milestones.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-gray-500">Completed</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {milestones.filter(m => m.status === 'in-progress').length}
            </div>
            <div className="text-gray-500">In Progress</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {milestones.reduce((sum, m) => sum + m.estimatedHours, 0)}h
            </div>
            <div className="text-gray-500">Total Hours</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {(milestones.reduce((sum, m) => sum + m.progress, 0) / Math.max(milestones.length, 1)).toFixed(0)}%
            </div>
            <div className="text-gray-500">Avg Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};
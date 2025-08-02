import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { useWidgetContext } from '../../contexts/WidgetContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { WidgetErrorBoundary } from '../widgets/WidgetErrorBoundary';
import { WidgetSkeleton } from '../widgets/WidgetSkeleton';
import { GitHubActivityWidget } from '../widgets/GitHubActivityWidget';
import { SkillRadarWidget } from '../widgets/SkillRadarWidget';
import { RoadmapWidget } from '../widgets/RoadmapWidget';
import { WidgetType } from '../../types/widget-types';
import { terminalLogger } from '../../utils/terminalLogger';

interface ResponsiveGridProps {
  className?: string;
  children?: React.ReactNode;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  className = '',
  children 
}) => {
  const { state, reorderWidgets } = useWidgetContext();
  const { layoutState, getGridPosition, canFitWidget } = useResponsiveLayout(state.layoutConfig);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    terminalLogger.info('ResponsiveGrid', 'Drag operation started');
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) {
      terminalLogger.debug('ResponsiveGrid', 'Drag cancelled - no destination');
      return;
    }

    if (result.source.index === result.destination.index) {
      terminalLogger.debug('ResponsiveGrid', 'Drag cancelled - same position');
      return;
    }

    const newOrder = Array.from(state.activeWidgets);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    terminalLogger.info('ResponsiveGrid', 'Widgets reordered', {
      from: result.source.index,
      to: result.destination.index,
      widgetId: reorderedItem,
      newOrder
    });

    reorderWidgets(newOrder);
  }, [state.activeWidgets, reorderWidgets]);

  const renderWidgetContent = useCallback((widgetType: WidgetType, widgetId: string) => {
    switch (widgetType) {
      case 'github-activity':
        return (
          <GitHubActivityWidget 
            widgetId={widgetId}
            username="testuser" // In real implementation, this would come from user settings
            className="h-full"
          />
        );
      
      case 'skill-radar':
        return (
          <SkillRadarWidget 
            widgetId={widgetId}
            className="h-full"
          />
        );
      
      case 'roadmap-board':
        return (
          <RoadmapWidget 
            widgetId={widgetId}
            targetRole="fullstack-developer"
            currentSkills={['JavaScript', 'React', 'Node.js']}
            className="h-full"
          />
        );
      
      case 'resume-reviewer':
        return (
          <div className="p-4 h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Resume Reviewer</h3>
            <div className="text-sm text-gray-600">
              AI-powered resume analysis coming soon...
            </div>
          </div>
        );
      
      case 'job-insights':
        return (
          <div className="p-4 h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Job Market Insights</h3>
            <div className="text-sm text-gray-600">
              Job market analysis coming soon...
            </div>
          </div>
        );
      
      case 'learning-resources':
        return (
          <div className="p-4 h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Learning Resources</h3>
            <div className="text-sm text-gray-600">
              Curated learning materials coming soon...
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4 h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Unknown Widget</h3>
            <div className="text-sm text-gray-600">
              Widget type: {widgetType}
            </div>
          </div>
        );
    }
  }, []);

  const calculateWidgetPosition = useCallback((index: number, widgetId: string) => {
    const widget = state.widgets[widgetId];
    if (!widget) return { x: 0, y: 0, width: 4, height: 2 };

    // Auto-layout algorithm for responsive positioning
    const widgetWidth = Math.min(widget.config.position.width || 4, layoutState.columns);
    const widgetHeight = widget.config.position.height || 2;

    // Simple grid packing algorithm
    let x = 0;
    let y = Math.floor(index / Math.floor(layoutState.columns / widgetWidth)) * widgetHeight;

    // Find the first available position
    for (let row = 0; row < 100; row++) {
      for (let col = 0; col <= layoutState.columns - widgetWidth; col++) {
        if (canFitWidget(col, widgetWidth)) {
          x = col;
          y = row * widgetHeight;
          break;
        }
      }
      if (x !== undefined) break;
    }

    return { x, y, width: widgetWidth, height: widgetHeight };
  }, [state.widgets, layoutState.columns, canFitWidget]);

  const renderWidget = useCallback((widgetId: string, index: number) => {
    const widget = state.widgets[widgetId];
    if (!widget) return null;

    const position = calculateWidgetPosition(index, widgetId);
    const gridPosition = getGridPosition(position.x, position.y, position.width, position.height);

    const widgetStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${gridPosition.left}px`,
      top: `${gridPosition.top}px`,
      width: `${gridPosition.width}px`,
      height: `${gridPosition.height}px`,
      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: isDragging ? 1000 : 1
    };

    return (
      <Draggable key={widgetId} draggableId={widgetId} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...widgetStyle,
              ...provided.draggableProps.style,
              transform: snapshot.isDragging 
                ? provided.draggableProps.style?.transform 
                : widgetStyle.transform
            }}
            className={`widget-container ${snapshot.isDragging ? 'dragging' : ''}`}
          >
            <WidgetErrorBoundary
              widgetId={widgetId}
              widgetType={widget.config.type}
              onError={(error) => {
                terminalLogger.error('ResponsiveGrid', `Widget error in grid: ${widgetId}`, {
                  error: error.message,
                  widgetType: widget.config.type
                });
              }}
            >
              <div 
                {...provided.dragHandleProps}
                className="widget-drag-handle absolute top-2 right-2 w-6 h-6 cursor-move opacity-0 hover:opacity-100 transition-opacity"
              >
                <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>

              {widget.isLoading ? (
                <WidgetSkeleton 
                  widgetType={widget.config.type}
                  width={gridPosition.width}
                  height={gridPosition.height}
                />
              ) : (
                <div className="widget-content h-full">
                  {renderWidgetContent(widget.config.type, widgetId)}
                </div>
              )}
            </WidgetErrorBoundary>
          </div>
        )}
      </Draggable>
    );
  }, [state.widgets, calculateWidgetPosition, getGridPosition, isDragging]);

  const calculateGridHeight = useCallback(() => {
    if (state.activeWidgets.length === 0) return 400;

    let maxY = 0;
    state.activeWidgets.forEach((widgetId, index) => {
      const position = calculateWidgetPosition(index, widgetId);
      const bottom = position.y + position.height;
      maxY = Math.max(maxY, bottom);
    });

    return (maxY * 200) + (maxY * layoutState.gap) + (state.layoutConfig.padding * 2);
  }, [state.activeWidgets, calculateWidgetPosition, layoutState.gap, state.layoutConfig.padding]);

  useEffect(() => {
    terminalLogger.info('ResponsiveGrid', 'Grid layout updated', {
      breakpoint: layoutState.currentBreakpoint,
      columns: layoutState.columns,
      activeWidgets: state.activeWidgets.length,
      containerWidth: layoutState.containerWidth
    });
  }, [layoutState, state.activeWidgets.length]);

  return (
    <div className={`responsive-grid ${className}`} ref={gridRef}>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="widget-grid" type="WIDGET">
          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid-container relative ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
              style={{
                minHeight: `${calculateGridHeight()}px`,
                width: '100%',
                position: 'relative'
              }}
            >
              {state.activeWidgets.map((widgetId, index) => 
                renderWidget(widgetId, index)
              )}
              {provided.placeholder}
              
              {state.activeWidgets.length === 0 && (
                <div className="empty-grid-state flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium mb-2">No widgets added yet</h3>
                    <p className="text-sm">Add widgets to start building your dashboard</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {children}
    </div>
  );
};
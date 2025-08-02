import React, { useCallback, useEffect, useState } from 'react';
import { useWidgetContext } from '../../contexts/WidgetContext';
import { ResponsiveGrid } from '../layout/ResponsiveGrid';
import { WidgetType, WidgetConfig } from '../../types/widget-types';
import { terminalLogger } from '../../utils/terminalLogger';

interface WidgetManagerProps {
  className?: string;
}

interface WidgetTemplate {
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: { width: number; height: number };
  icon: string;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    type: 'github-activity',
    title: 'GitHub Activity',
    description: 'Track your GitHub contributions and repository activity',
    defaultSize: { width: 6, height: 3 },
    icon: '📊'
  },
  {
    type: 'skill-radar',
    title: 'Skill Radar',
    description: 'Visualize your skill levels and identify gaps',
    defaultSize: { width: 4, height: 4 },
    icon: '🎯'
  },
  {
    type: 'roadmap-board',
    title: 'Learning Roadmap',
    description: 'Manage your learning milestones and progress',
    defaultSize: { width: 8, height: 4 },
    icon: '🗺️'
  },
  {
    type: 'resume-reviewer',
    title: 'Resume Reviewer',
    description: 'Get AI-powered feedback on your resume',
    defaultSize: { width: 6, height: 5 },
    icon: '📄'
  },
  {
    type: 'job-insights',
    title: 'Job Market Insights',
    description: 'Explore job opportunities and market trends',
    defaultSize: { width: 8, height: 4 },
    icon: '💼'
  },
  {
    type: 'learning-resources',
    title: 'Learning Resources',
    description: 'Discover curated learning materials',
    defaultSize: { width: 4, height: 3 },
    icon: '📚'
  }
];

export const WidgetManager: React.FC<WidgetManagerProps> = ({ className = '' }) => {
  const { state, addWidget, removeWidget } = useWidgetContext();
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [widgetCounter, setWidgetCounter] = useState(1);

  const handleAddWidget = useCallback((template: WidgetTemplate) => {
    const widgetId = `${template.type}-${widgetCounter}`;
    
    const config: WidgetConfig = {
      id: widgetId,
      type: template.type,
      title: template.title,
      position: {
        x: 0,
        y: 0,
        width: template.defaultSize.width,
        height: template.defaultSize.height
      },
      isVisible: true,
      isMinimized: false,
      isLoading: false,
      hasError: false,
      lastUpdated: new Date(),
      refreshInterval: 300000, // 5 minutes
      customSettings: {}
    };

    terminalLogger.info('WidgetManager', `Adding widget: ${widgetId}`, {
      type: template.type,
      title: template.title,
      size: template.defaultSize
    });

    addWidget(widgetId, config);
    setWidgetCounter(prev => prev + 1);
    setShowAddWidget(false);
  }, [addWidget, widgetCounter]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    terminalLogger.info('WidgetManager', `Removing widget: ${widgetId}`);
    removeWidget(widgetId);
  }, [removeWidget]);

  const getAvailableTemplates = useCallback(() => {
    const activeTypes = Object.values(state.widgets).map(w => w.config.type);
    return WIDGET_TEMPLATES.filter(template => {
      // Allow multiple instances of certain widget types
      const allowMultiple = ['github-activity', 'learning-resources'];
      return allowMultiple.includes(template.type) || !activeTypes.includes(template.type);
    });
  }, [state.widgets]);

  useEffect(() => {
    terminalLogger.info('WidgetManager', 'Widget manager initialized', {
      totalWidgets: Object.keys(state.widgets).length,
      activeWidgets: state.activeWidgets.length,
      availableTemplates: getAvailableTemplates().length
    });
  }, [getAvailableTemplates, state.activeWidgets.length, state.widgets]);

  return (
    <div className={`widget-manager ${className}`}>
      {/* Widget Management Toolbar */}
      <div className="widget-toolbar flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <span className="text-sm text-gray-500">
            {state.activeWidgets.length} widget{state.activeWidgets.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddWidget(!showAddWidget)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Widget
          </button>
          
          {state.activeWidgets.length > 0 && (
            <button
              onClick={() => {
                terminalLogger.info('WidgetManager', 'Refreshing all widgets');
                // Trigger refresh for all widgets
                state.activeWidgets.forEach(widgetId => {
                  const widget = state.widgets[widgetId];
                  if (widget && !widget.isLoading) {
                    // Individual widgets will handle their own refresh logic
                  }
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Refresh All
            </button>
          )}
        </div>
      </div>

      {/* Add Widget Panel */}
      {showAddWidget && (
        <div className="add-widget-panel p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-3">Add New Widget</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAvailableTemplates().map((template) => (
              <div
                key={template.type}
                className="widget-template p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => handleAddWidget(template)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{template.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      Size: {template.defaultSize.width}×{template.defaultSize.height}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {getAvailableTemplates().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>All available widgets have been added!</p>
            </div>
          )}
        </div>
      )}

      {/* Widget Grid */}
      <div className="widget-grid-container flex-1 bg-gray-100 min-h-screen">
        <ResponsiveGrid className="p-4">
          {/* Active widgets management */}
          {state.activeWidgets.length > 0 && (
            <div className="widget-controls fixed bottom-4 right-4 z-50">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                <div className="text-xs text-gray-500 mb-2">Widget Controls</div>
                <div className="space-y-1">
                  {state.activeWidgets.map(widgetId => {
                    const widget = state.widgets[widgetId];
                    if (!widget) return null;
                    
                    return (
                      <div key={widgetId} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-24">{widget.config.title}</span>
                        <button
                          onClick={() => handleRemoveWidget(widgetId)}
                          className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          title="Remove widget"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </ResponsiveGrid>
      </div>
    </div>
  );
};
import { useCallback, useEffect, useRef } from 'react';
import { useWidgetContext } from '../contexts/WidgetContext';
import { WidgetConfig, WidgetData } from '../types/widget-types';
import { terminalLogger } from '../utils/terminalLogger';

export function useWidgetState(widgetId: string) {
  const { state, updateWidgetData, setWidgetLoading, setWidgetError } = useWidgetContext();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const widget = state.widgets[widgetId];

  const refreshData = useCallback(async (forceRefresh = false) => {
    if (!widget) {
      terminalLogger.error('useWidgetState', `Widget not found: ${widgetId}`);
      return;
    }

    const now = Date.now();
    const lastUpdated = widget.config.lastUpdated?.getTime() || 0;
    const refreshInterval = widget.config.refreshInterval || 300000; // 5 minutes default

    if (!forceRefresh && (now - lastUpdated) < refreshInterval) {
      terminalLogger.debug('useWidgetState', `Skipping refresh for ${widgetId} - too recent`, {
        timeSinceLastUpdate: now - lastUpdated,
        refreshInterval
      });
      return;
    }

    terminalLogger.info('useWidgetState', `Refreshing data for widget: ${widgetId}`, { forceRefresh });
    
    try {
      setWidgetLoading(widgetId, true);
      
      // Widget-specific data fetching logic will be implemented by individual widgets
      // This is a placeholder for the common refresh pattern
      
      terminalLogger.info('useWidgetState', `Data refresh completed for widget: ${widgetId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      terminalLogger.error('useWidgetState', `Data refresh failed for widget: ${widgetId}`, { error: errorMessage });
      setWidgetError(widgetId, errorMessage);
    } finally {
      setWidgetLoading(widgetId, false);
    }
  }, [widget, widgetId, setWidgetLoading, setWidgetError]);

  const updateData = useCallback((data: WidgetData) => {
    terminalLogger.debug('useWidgetState', `Updating data for widget: ${widgetId}`, { 
      dataKeys: Object.keys(data) 
    });
    updateWidgetData(widgetId, data);
  }, [widgetId, updateWidgetData]);

  const startAutoRefresh = useCallback(() => {
    if (!widget?.config.refreshInterval) return;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    terminalLogger.info('useWidgetState', `Starting auto-refresh for widget: ${widgetId}`, {
      interval: widget.config.refreshInterval
    });

    refreshIntervalRef.current = setInterval(() => {
      refreshData(false);
    }, widget.config.refreshInterval);
  }, [widget?.config.refreshInterval, widgetId, refreshData]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      terminalLogger.info('useWidgetState', `Stopping auto-refresh for widget: ${widgetId}`);
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, [widgetId]);

  useEffect(() => {
    if (widget?.config.refreshInterval && widget.config.isVisible) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [widget?.config.refreshInterval, widget?.config.isVisible, startAutoRefresh, stopAutoRefresh]);

  return {
    widget,
    isLoading: widget?.isLoading || false,
    error: widget?.error || null,
    data: widget?.data || {},
    refreshData,
    updateData,
    startAutoRefresh,
    stopAutoRefresh
  };
}
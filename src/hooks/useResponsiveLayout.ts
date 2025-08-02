import { useState, useEffect, useCallback } from 'react';
import { GridBreakpoint, WidgetLayoutConfig } from '../types/widget-types';
import { terminalLogger } from '../utils/terminalLogger';

interface ResponsiveLayoutState {
  currentBreakpoint: string;
  columns: number;
  containerWidth: number;
  columnWidth: number;
  gap: number;
}

export function useResponsiveLayout(layoutConfig: WidgetLayoutConfig) {
  const [layoutState, setLayoutState] = useState<ResponsiveLayoutState>({
    currentBreakpoint: 'lg',
    columns: 12,
    containerWidth: 1200,
    columnWidth: 100,
    gap: layoutConfig.gap
  });

  const calculateLayout = useCallback((containerWidth: number) => {
    const breakpoint = layoutConfig.breakpoints.find(bp => 
      containerWidth >= bp.minWidth
    ) || layoutConfig.breakpoints[layoutConfig.breakpoints.length - 1];

    const availableWidth = containerWidth - (layoutConfig.padding * 2);
    const totalGapWidth = (breakpoint.columns - 1) * layoutConfig.gap;
    const columnWidth = (availableWidth - totalGapWidth) / breakpoint.columns;

    const newState: ResponsiveLayoutState = {
      currentBreakpoint: breakpoint.breakpoint,
      columns: breakpoint.columns,
      containerWidth,
      columnWidth,
      gap: layoutConfig.gap
    };

    terminalLogger.debug('useResponsiveLayout', 'Layout calculated', {
      breakpoint: breakpoint.breakpoint,
      columns: breakpoint.columns,
      containerWidth,
      columnWidth,
      availableWidth
    });

    return newState;
  }, [layoutConfig]);

  const handleResize = useCallback(() => {
    const containerWidth = window.innerWidth;
    const newLayoutState = calculateLayout(containerWidth);
    
    if (newLayoutState.currentBreakpoint !== layoutState.currentBreakpoint) {
      terminalLogger.info('useResponsiveLayout', 'Breakpoint changed', {
        from: layoutState.currentBreakpoint,
        to: newLayoutState.currentBreakpoint,
        newColumns: newLayoutState.columns
      });
    }

    setLayoutState(newLayoutState);
  }, [calculateLayout, layoutState.currentBreakpoint]);

  useEffect(() => {
    // Initial calculation
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    terminalLogger.info('useResponsiveLayout', 'Responsive layout initialized', {
      initialBreakpoint: layoutState.currentBreakpoint,
      initialColumns: layoutState.columns
    });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getWidgetDimensions = useCallback((widthSpan: number, heightSpan: number) => {
    const width = (widthSpan * layoutState.columnWidth) + ((widthSpan - 1) * layoutState.gap);
    const height = heightSpan * 200; // Base height unit
    
    return {
      width: Math.max(width, 200), // Minimum width
      height: Math.min(Math.max(height, layoutConfig.minWidgetHeight), layoutConfig.maxWidgetHeight)
    };
  }, [layoutState, layoutConfig]);

  const getGridPosition = useCallback((x: number, y: number, width: number, height: number) => {
    const left = (x * layoutState.columnWidth) + (x * layoutState.gap) + layoutConfig.padding;
    const top = (y * 200) + (y * layoutState.gap) + layoutConfig.padding; // 200px base row height
    
    return {
      left,
      top,
      width: getWidgetDimensions(width, height).width,
      height: getWidgetDimensions(width, height).height
    };
  }, [layoutState, layoutConfig, getWidgetDimensions]);

  const canFitWidget = useCallback((x: number, width: number) => {
    return (x + width) <= layoutState.columns;
  }, [layoutState.columns]);

  return {
    layoutState,
    getWidgetDimensions,
    getGridPosition,
    canFitWidget,
    calculateLayout
  };
}
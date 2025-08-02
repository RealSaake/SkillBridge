export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  isVisible: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  lastUpdated?: Date;
  refreshInterval?: number;
  customSettings?: Record<string, any>;
}

export type WidgetType = 
  | 'github-activity'
  | 'skill-radar'
  | 'roadmap-board'
  | 'resume-reviewer'
  | 'job-insights'
  | 'learning-resources';

export interface WidgetData {
  [key: string]: any;
}

export interface WidgetState {
  config: WidgetConfig;
  data: WidgetData;
  isLoading: boolean;
  error: string | null;
}

export interface GridBreakpoint {
  breakpoint: string;
  columns: number;
  minWidth: number;
}

export interface WidgetLayoutConfig {
  breakpoints: GridBreakpoint[];
  gap: number;
  padding: number;
  minWidgetHeight: number;
  maxWidgetHeight: number;
}

export interface DragDropResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
}

export interface WidgetErrorInfo {
  componentStack: string;
  errorBoundary: string;
  eventType: string;
}
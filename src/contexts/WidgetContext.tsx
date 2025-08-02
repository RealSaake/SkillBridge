import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { WidgetState, WidgetConfig, WidgetData, WidgetType } from '../types/widget-types';
import { terminalLogger } from '../utils/terminalLogger';

interface WidgetContextState {
  widgets: Record<string, WidgetState>;
  activeWidgets: string[];
  layoutConfig: any;
}

type WidgetAction =
  | { type: 'ADD_WIDGET'; payload: { id: string; config: WidgetConfig } }
  | { type: 'REMOVE_WIDGET'; payload: { id: string } }
  | { type: 'UPDATE_WIDGET_CONFIG'; payload: { id: string; config: Partial<WidgetConfig> } }
  | { type: 'UPDATE_WIDGET_DATA'; payload: { id: string; data: WidgetData } }
  | { type: 'SET_WIDGET_LOADING'; payload: { id: string; isLoading: boolean } }
  | { type: 'SET_WIDGET_ERROR'; payload: { id: string; error: string | null } }
  | { type: 'REORDER_WIDGETS'; payload: { widgetIds: string[] } };

const initialState: WidgetContextState = {
  widgets: {},
  activeWidgets: [],
  layoutConfig: {
    breakpoints: [
      { breakpoint: 'lg', columns: 12, minWidth: 1200 },
      { breakpoint: 'md', columns: 8, minWidth: 768 },
      { breakpoint: 'sm', columns: 4, minWidth: 480 },
      { breakpoint: 'xs', columns: 2, minWidth: 0 }
    ],
    gap: 16,
    padding: 24,
    minWidgetHeight: 200,
    maxWidgetHeight: 600
  }
};

function widgetReducer(state: WidgetContextState, action: WidgetAction): WidgetContextState {
  terminalLogger.debug('WidgetReducer', `Processing action: ${action.type}`, { action });

  switch (action.type) {
    case 'ADD_WIDGET':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            config: action.payload.config,
            data: {},
            isLoading: false,
            error: null
          }
        },
        activeWidgets: [...state.activeWidgets, action.payload.id]
      };

    case 'REMOVE_WIDGET':
      const { [action.payload.id]: removed, ...remainingWidgets } = state.widgets;
      return {
        ...state,
        widgets: remainingWidgets,
        activeWidgets: state.activeWidgets.filter(id => id !== action.payload.id)
      };

    case 'UPDATE_WIDGET_CONFIG':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            config: {
              ...state.widgets[action.payload.id].config,
              ...action.payload.config
            }
          }
        }
      };

    case 'UPDATE_WIDGET_DATA':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            data: action.payload.data,
            isLoading: false,
            error: null
          }
        }
      };

    case 'SET_WIDGET_LOADING':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            isLoading: action.payload.isLoading
          }
        }
      };

    case 'SET_WIDGET_ERROR':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            error: action.payload.error,
            isLoading: false
          }
        }
      };

    case 'REORDER_WIDGETS':
      return {
        ...state,
        activeWidgets: action.payload.widgetIds
      };

    default:
      return state;
  }
}

interface WidgetContextValue {
  state: WidgetContextState;
  addWidget: (id: string, config: WidgetConfig) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Partial<WidgetConfig>) => void;
  updateWidgetData: (id: string, data: WidgetData) => void;
  setWidgetLoading: (id: string, isLoading: boolean) => void;
  setWidgetError: (id: string, error: string | null) => void;
  reorderWidgets: (widgetIds: string[]) => void;
}

const WidgetContext = createContext<WidgetContextValue | undefined>(undefined);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(widgetReducer, initialState);

  const addWidget = useCallback((id: string, config: WidgetConfig) => {
    terminalLogger.info('WidgetProvider', `Adding widget: ${id}`, { config });
    dispatch({ type: 'ADD_WIDGET', payload: { id, config } });
  }, []);

  const removeWidget = useCallback((id: string) => {
    terminalLogger.info('WidgetProvider', `Removing widget: ${id}`);
    dispatch({ type: 'REMOVE_WIDGET', payload: { id } });
  }, []);

  const updateWidgetConfig = useCallback((id: string, config: Partial<WidgetConfig>) => {
    terminalLogger.debug('WidgetProvider', `Updating widget config: ${id}`, { config });
    dispatch({ type: 'UPDATE_WIDGET_CONFIG', payload: { id, config } });
  }, []);

  const updateWidgetData = useCallback((id: string, data: WidgetData) => {
    terminalLogger.debug('WidgetProvider', `Updating widget data: ${id}`, { dataKeys: Object.keys(data) });
    dispatch({ type: 'UPDATE_WIDGET_DATA', payload: { id, data } });
  }, []);

  const setWidgetLoading = useCallback((id: string, isLoading: boolean) => {
    terminalLogger.debug('WidgetProvider', `Setting widget loading: ${id}`, { isLoading });
    dispatch({ type: 'SET_WIDGET_LOADING', payload: { id, isLoading } });
  }, []);

  const setWidgetError = useCallback((id: string, error: string | null) => {
    terminalLogger.error('WidgetProvider', `Setting widget error: ${id}`, { error });
    dispatch({ type: 'SET_WIDGET_ERROR', payload: { id, error } });
  }, []);

  const reorderWidgets = useCallback((widgetIds: string[]) => {
    terminalLogger.info('WidgetProvider', 'Reordering widgets', { widgetIds });
    dispatch({ type: 'REORDER_WIDGETS', payload: { widgetIds } });
  }, []);

  useEffect(() => {
    terminalLogger.info('WidgetProvider', 'Widget context initialized', { 
      widgetCount: Object.keys(state.widgets).length,
      activeWidgets: state.activeWidgets.length
    });
  }, []);

  const value: WidgetContextValue = {
    state,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    updateWidgetData,
    setWidgetLoading,
    setWidgetError,
    reorderWidgets
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgetContext() {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error('useWidgetContext must be used within a WidgetProvider');
  }
  return context;
}
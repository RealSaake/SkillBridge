import React, { useEffect } from 'react';
import { WidgetProvider } from '../contexts/WidgetContext';
import { WidgetManager } from './widgets/WidgetManager';
import { terminalLogger } from '../utils/terminalLogger';

export const CommandCenter: React.FC = () => {
  useEffect(() => {
    terminalLogger.info('CommandCenter', 'Command Center initialized', {
      timestamp: new Date().toISOString(),
      route: '/command-center'
    });
  }, []);

  return (
    <WidgetProvider>
      <div className="command-center min-h-screen bg-gray-50">
        <WidgetManager className="h-full" />
      </div>
    </WidgetProvider>
  );
};
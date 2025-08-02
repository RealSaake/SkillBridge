interface LogEntry {
  timestamp: string;
  protocol: string;
  phase: string;
  traceId: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'FATAL';
  component: string;
  message: string;
  payload?: any;
}

class TerminalLogger {
  private static instance: TerminalLogger;
  private sessionTraceId: string;
  private traceCounter = 0;

  private constructor() {
    this.sessionTraceId = `SINGULARITY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): TerminalLogger {
    if (!TerminalLogger.instance) {
      TerminalLogger.instance = new TerminalLogger();
    }
    return TerminalLogger.instance;
  }

  getSessionTraceId(): string {
    return this.sessionTraceId;
  }

  private log(level: LogEntry['level'], component: string, message: string, payload?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      protocol: "SINGULARITY",
      phase: "RESURRECTION",
      traceId: this.sessionTraceId,
      level,
      component,
      message,
      payload
    };

    // UNBREAKABLE LOGGING PROTOCOL - ALL OUTPUT MUST BE STRUCTURED JSON
    console.log(JSON.stringify(logEntry));
  }

  info(component: string, message: string, payload?: any): void {
    this.log('INFO', component, message, payload);
  }

  warn(component: string, message: string, payload?: any): void {
    this.log('WARN', component, message, payload);
  }

  error(component: string, message: string, payload?: any): void {
    this.log('ERROR', component, message, payload);
  }

  debug(component: string, message: string, payload?: any): void {
    this.log('DEBUG', component, message, payload);
  }

  fatal(component: string, message: string, payload?: any): void {
    this.log('FATAL', component, message, payload);
  }

  // MCP Integration Logging
  mcpRequest(component: string, server: string, method: string, params: any): void {
    this.log('INFO', component, `MCP Request: ${server}.${method}`, { 
      server, 
      method, 
      requestPayload: params 
    });
  }

  mcpResponse(component: string, server: string, method: string, response: any): void {
    this.log('INFO', component, `MCP Response: ${server}.${method}`, { 
      server, 
      method, 
      responsePayload: response 
    });
  }

  mcpError(component: string, server: string, method: string, error: any): void {
    this.log('ERROR', component, `MCP Error: ${server}.${method}`, { 
      server, 
      method, 
      error: error.message || error 
    });
  }
}

export const terminalLogger = TerminalLogger.getInstance();
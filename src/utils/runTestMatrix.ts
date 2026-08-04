import { testMatrixRunner } from './testMatrix';

console.log('====================================================');
console.log('POSSIBILITIES MASTER 40-POINT TEST MATRIX RUNNER');
console.log('====================================================');

const results = testMatrixRunner.runAllTests();

results.results.forEach((test) => {
  const status = test.passed ? 'PASS' : test.notTestableInEnv ? 'NOT TESTABLE' : 'FAIL';
  console.log(`[${status}] Test ${test.id}: ${test.name}`);
  console.log(`    Details: ${test.details}`);
});

console.log('----------------------------------------------------');
console.log(`SUMMARY: ${results.passedCount} / ${results.totalCount} PASSED (${results.notTestableCount} NOT TESTABLE IN ENV)`);
console.log('====================================================');

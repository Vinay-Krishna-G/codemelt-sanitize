import assert from 'node:assert';
import { program, repositoryService } from '../src/index.js';

// Setup environment for testing
process.env.NODE_ENV = 'test';

function testCommandRegistration() {
  console.log('Running: testCommandRegistration');
  
  assert.strictEqual(program.name(), 'codemelt-sanitize');
  assert.strictEqual(program.description(), 'Sanitize repositories before commit, publishing, or AI sharing.');
  
  const analyzeCmd = program.commands.find(c => c.name() === 'analyze');
  assert.ok(analyzeCmd, 'Analyze command should be registered');

  const cleanCmd = program.commands.find(c => c.name() === 'clean');
  assert.ok(cleanCmd, 'Clean command should be registered');
  
  const dryRunOpt = cleanCmd.options.find(o => o.long === '--dry-run');
  assert.ok(dryRunOpt, 'Clean command should have --dry-run option');
}

async function testScanRepositoryInvocation() {
  console.log('Running: testScanRepositoryInvocation');

  let scanCalled = false;
  let scanOptions: any = null;

  // Mock repositoryService.scanRepository
  repositoryService.scanRepository = async (options) => {
    scanCalled = true;
    scanOptions = options;
    return {
      filesScanned: ['src/test.ts'],
      filesSkipped: [],
      totalIssues: 5,
      issues: [],
      errors: []
    };
  };

  // Programmatically trigger analyze command
  await program.parseAsync(['node', 'index.js', 'analyze', 'my-custom-path']);

  assert.ok(scanCalled, 'scanRepository should have been called');
  assert.strictEqual(scanOptions.root, 'my-custom-path', 'Should pass correct directory path to scanRepository');
}

async function testCleanRepositoryInvocationAndDryRun() {
  console.log('Running: testCleanRepositoryInvocationAndDryRun');

  let cleanCalled = false;
  let cleanOptions: any = null;

  // Mock repositoryService.cleanRepository
  repositoryService.cleanRepository = async (options) => {
    cleanCalled = true;
    cleanOptions = options;
    return {
      filesScanned: ['src/test.ts'],
      filesSkipped: [],
      filesCleaned: ['src/test.ts'],
      bytesSaved: 120,
      totalIssues: 5,
      issues: [],
      errors: []
    };
  };

  // 1. Verify clean invocation without --dry-run
  cleanCalled = false;
  await program.parseAsync(['node', 'index.js', 'clean', 'clean-path']);
  assert.ok(cleanCalled, 'cleanRepository should have been called');
  assert.strictEqual(cleanOptions.root, 'clean-path');
  assert.strictEqual(cleanOptions.dryRun, false, 'dryRun should be false by default');

  // 2. Verify clean invocation with --dry-run
  cleanCalled = false;
  await program.parseAsync(['node', 'index.js', 'clean', 'clean-path', '--dry-run']);
  assert.ok(cleanCalled, 'cleanRepository should have been called');
  assert.strictEqual(cleanOptions.root, 'clean-path');
  assert.strictEqual(cleanOptions.dryRun, true, 'dryRun should be true when flag is present');
}

async function runCliTests() {
  console.log('Starting CodeMelt Sanitize CLI tests...\n');
  try {
    testCommandRegistration();
    await testScanRepositoryInvocation();
    await testCleanRepositoryInvocationAndDryRun();
    console.log('\nAll CLI tests completed successfully!');
  } catch (error) {
    console.error('CLI test execution failed:', error);
    process.exit(1);
  }
}

runCliTests();

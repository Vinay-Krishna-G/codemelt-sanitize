import assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { scanRepository, cleanRepository } from '../src/repository.js';

const tempDir = path.resolve('./packages/core/tests/temp_repo_test');

async function setupFixtures() {
  // Ensure fresh directory
  await fs.rm(tempDir, { recursive: true, force: true });
  await fs.mkdir(tempDir, { recursive: true });

  // Create subdirectories
  await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'dist'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'custom_ignore'), { recursive: true });

  // Create files
  await fs.writeFile(
    path.join(tempDir, 'src', 'index.ts'),
    `
      // TODO: implement core
      const val = 100;
      console.log(val);
    `,
    'utf-8'
  );

  await fs.writeFile(
    path.join(tempDir, 'node_modules', 'ignored.ts'),
    `console.log("inside node_modules");`,
    'utf-8'
  );

  await fs.writeFile(
    path.join(tempDir, 'dist', 'bundle.js'),
    `console.log("inside dist");`,
    'utf-8'
  );

  await fs.writeFile(
    path.join(tempDir, 'custom_ignore', 'test.ts'),
    `console.log("inside custom_ignore");`,
    'utf-8'
  );

  // Write ignore file
  await fs.writeFile(
    path.join(tempDir, '.codemelt-sanitize-ignore'),
    `
      # custom comment
      custom_ignore
    `,
    'utf-8'
  );
}

async function cleanupFixtures() {
  await fs.rm(tempDir, { recursive: true, force: true });
}

async function testRepositoryScan() {
  console.log('Running: testRepositoryScan');
  await setupFixtures();

  const result = await scanRepository({
    root: tempDir,
    recursive: true
  });

  // Verify only src/index.ts is scanned
  assert.strictEqual(result.filesScanned.length, 1, 'Should scan exactly 1 file');
  assert.ok(result.filesScanned[0].endsWith('index.ts'), 'Scanned file should be index.ts');

  // Verify issues
  const todoIssues = result.issues.filter(i => i.type === 'todo');
  const logIssues = result.issues.filter(i => i.type === 'console_log');
  assert.strictEqual(todoIssues.length, 1, 'Should detect 1 TODO issue');
  assert.strictEqual(logIssues.length, 1, 'Should detect 1 console_log issue');
}

async function testIgnoreRules() {
  console.log('Running: testIgnoreRules');
  // File list in result.filesSkipped should contain node_modules, dist, and custom_ignore files
  const result = await scanRepository({
    root: tempDir,
    recursive: true
  });

  const skippedList = result.filesSkipped.map(p => path.basename(p));
  assert.ok(skippedList.includes('node_modules'), 'Should skip node_modules directory');
  assert.ok(skippedList.includes('dist'), 'Should skip dist directory');
  assert.ok(skippedList.includes('custom_ignore'), 'Should skip custom_ignore directory');
}

async function testDryRunCleaning() {
  console.log('Running: testDryRunCleaning');
  await setupFixtures();

  const cleanResult = await cleanRepository({
    root: tempDir,
    dryRun: true
  });

  assert.strictEqual(cleanResult.filesCleaned.length, 1, 'Should mark 1 file to be cleaned');
  
  // Verify file on disk remains unchanged
  const content = await fs.readFile(path.join(tempDir, 'src', 'index.ts'), 'utf-8');
  assert.ok(content.includes('console.log(val)'), 'File should remain unchanged in dry run');
}

async function testWriteCleaning() {
  console.log('Running: testWriteCleaning');
  await setupFixtures();

  const cleanResult = await cleanRepository({
    root: tempDir,
    dryRun: false
  });

  assert.strictEqual(cleanResult.filesCleaned.length, 1, 'Should clean 1 file');

  // Verify file on disk has been updated (comments and console.log removed)
  const content = await fs.readFile(path.join(tempDir, 'src', 'index.ts'), 'utf-8');
  assert.ok(!content.includes('TODO'), 'TODO comment should be removed');
  assert.ok(!content.includes('console.log'), 'console.log statement should be removed');
  assert.ok(content.includes('const val = 100;'), 'Surrounding code should be preserved');
}

async function testErrorHandling() {
  console.log('Running: testErrorHandling');
  await setupFixtures();

  // We write an unreadable directory reference or cause a read error by scanning a file path that is deleted immediately.
  // We can simulate it by adding a non-existent file path directly to a mock test or by deleting a file right before scanning.
  // Since we traverse first, then read, if we delete src/index.ts between the collect step and the read step, it will throw ENOENT!
  
  // Custom execution flow to simulate ENOENT
  const root = tempDir;
  const resultPromise = scanRepository({
    root,
    recursive: true
  });

  // Delete file right after directory collect starts (we do it sequentially here for simplicity)
  // Let's just create a test that calls scanRepository on a nonexistent root directory, which will throw directory readdir error.
  const invalidResult = await scanRepository({
    root: path.join(tempDir, 'nonexistent_folder')
  });

  assert.strictEqual(invalidResult.errors.length, 1, 'Should collect directory readdir error');
  assert.ok(invalidResult.errors[0].error.includes('ENOENT'), 'Error should be ENOENT');
}

async function runAllRepositoryTests() {
  console.log('Starting CodeMelt Sanitize Repository Layer tests...\n');
  try {
    await testRepositoryScan();
    await testIgnoreRules();
    await testDryRunCleaning();
    await testWriteCleaning();
    await testErrorHandling();
    await cleanupFixtures();
    console.log('\nAll repository layer tests completed successfully!');
  } catch (error) {
    console.error('Repository test execution failed:', error);
    try {
      await cleanupFixtures();
    } catch {}
    process.exit(1);
  }
}

runAllRepositoryTests();

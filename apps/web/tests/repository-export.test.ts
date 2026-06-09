import assert from 'node:assert';
import { unzipSync } from 'fflate';
import { exportRepositoryZip } from '../src/lib/repository/repository-export';
import type { RepositoryAnalysis } from '../src/types/sanitize';
import { scanContent } from 'codemelt-sanitize-core/dist/scanner.js';
import { cleanRepositoryFile, recalculateRepositoryMetrics } from '../src/lib/repository/repository-cleaner';
import { DEFAULT_ANALYZE_CONFIG } from '../src/lib/default-config';
import { calculateHealthScore } from '../src/lib/repository/health-score';

// Helper to convert Uint8Array back to string
function u8ToString(u8: Uint8Array): string {
  return new TextDecoder().decode(u8);
}

function runExportTests() {
  console.log('Running: repository-export.test.ts (Standard Cases)');

  // Set up mock repository analysis with varying files
  const mockRepoAnalysis: RepositoryAnalysis = {
    totalFiles: 2,
    totalIssues: 0,
    totalBytes: 100,
    totalBytesSaved: 0,
    totalComments: 0,
    totalTodos: 0,
    totalFixmes: 0,
    totalConsoleLogs: 0,
    files: [
      {
        path: 'sample-project/src/index.ts',
        content: 'original index content',
        cleanedContent: 'cleaned index content',
        issues: [],
        issueCount: 0,
        originalBytes: 22
      },
      {
        path: 'sample-project/src/utils.ts',
        content: 'original utils content',
        cleanedContent: undefined,
        issues: [],
        issueCount: 0,
        originalBytes: 22
      }
    ]
  };

  const zipBytes = exportRepositoryZip('sample-project', mockRepoAnalysis);

  // Unzip the bytes to verify content
  const unzipped = unzipSync(zipBytes);

  // Test 1: Metadata Generation
  console.log('  Testing export-metadata.json content...');
  assert.ok(unzipped['export-metadata.json'], 'export-metadata.json should exist in ZIP');
  const metadata = JSON.parse(u8ToString(unzipped['export-metadata.json']));
  assert.strictEqual(metadata.toolName, 'CodeMelt Sanitize', 'toolName should match');
  assert.strictEqual(typeof metadata.version, 'string', 'version should be a string');
  assert.strictEqual(typeof metadata.generatedAt, 'string', 'generatedAt should be an ISO string');
  assert.strictEqual(metadata.healthScore, 100, 'healthScore should be calculated');

  // Test 2: Report Inclusion
  console.log('  Testing report.json and report.md existence...');
  assert.ok(unzipped['report.json'], 'report.json should exist in ZIP');
  assert.ok(unzipped['report.md'], 'report.md should exist in ZIP');
  const reportJson = JSON.parse(u8ToString(unzipped['report.json']));
  assert.strictEqual(reportJson.repositoryName, 'sample-project');

  // Test 3: Cleaned Content Preference
  console.log('  Testing preference for cleaned content when available...');
  const indexContent = u8ToString(unzipped['sample-project/src/index.ts']);
  assert.strictEqual(indexContent, 'cleaned index content', 'ZIP should contain cleaned content');

  // Test 4: Original Content Fallback
  console.log('  Testing fallback to original content when cleaned is undefined...');
  const utilsContent = u8ToString(unzipped['sample-project/src/utils.ts']);
  assert.strictEqual(utilsContent, 'original utils content', 'ZIP should fall back to original content');

  // Test 5: Folder Structure Preservation
  console.log('  Testing folder structure preservation...');
  assert.ok(unzipped['sample-project/src/index.ts'], 'Nested paths should be preserved');
  assert.ok(unzipped['sample-project/src/utils.ts'], 'Nested paths should be preserved');

  console.log('  Standard cases completed successfully!\n');
}

function testReImportValidation() {
  console.log('Running: testReImportValidation (End-to-End Simulation)');

  // 1. Initial State: Uploaded files with issues
  const rawFiles = [
    {
      path: 'sample-project/src/index.ts',
      content: '// FIXME: this must be resolved\nconst x = 1;\nconsole.log(x); // TODO: check console output'
    },
    {
      path: 'sample-project/src/utils.ts',
      content: '/* This is a comment */\nexport function test() { return 42; }'
    }
  ];

  // 2. Scan / Analyze
  console.log('  Scanning initial files...');
  const analyzedFiles = rawFiles.map((file) => {
    const issues = scanContent(file.content, file.path, DEFAULT_ANALYZE_CONFIG);
    return {
      path: file.path,
      content: file.content,
      issues,
      issueCount: issues.length,
      originalBytes: new TextEncoder().encode(file.content).length
    };
  });

  const initialMetrics = recalculateRepositoryMetrics(analyzedFiles);
  const initialRepoAnalysis: RepositoryAnalysis = {
    files: analyzedFiles,
    totalFiles: analyzedFiles.length,
    ...initialMetrics
  };

  // Verify that there are issues initially
  assert.ok(initialRepoAnalysis.totalIssues > 0, 'Should have issues initially');
  const initialHealthScore = calculateHealthScore(
    initialRepoAnalysis.totalFiles,
    initialRepoAnalysis.totalFixmes,
    initialRepoAnalysis.totalTodos + initialRepoAnalysis.totalConsoleLogs,
    initialRepoAnalysis.totalComments
  );
  assert.ok(initialHealthScore < 100, 'Initial health score should be below 100');
  console.log(`    Initial Health Score: ${initialHealthScore}`);
  console.log(`    Initial Issues: ${initialRepoAnalysis.totalIssues}`);

  // 3. Clean Repository
  console.log('  Cleaning files...');
  const cleanedFiles = analyzedFiles.map((file) => cleanRepositoryFile(file, DEFAULT_ANALYZE_CONFIG));
  const cleanedMetrics = recalculateRepositoryMetrics(cleanedFiles);
  const cleanedRepoAnalysis: RepositoryAnalysis = {
    files: cleanedFiles,
    totalFiles: cleanedFiles.length,
    ...cleanedMetrics
  };

  // 4. Export ZIP
  console.log('  Exporting repository ZIP...');
  const zipBytes = exportRepositoryZip('sample-project', cleanedRepoAnalysis);

  // 5. Extract ZIP (Simulate Re-import)
  console.log('  Extracting ZIP (Simulated Re-import)...');
  const unzipped = unzipSync(zipBytes);

  // 6. Upload / Analyze Again (Scan unzipped files)
  console.log('  Analyzing re-imported files...');
  const reImportedFiles: { path: string; content: string }[] = [];
  Object.entries(unzipped).forEach(([filePath, fileBytes]) => {
    // Ignore report and metadata files
    if (['report.json', 'report.md', 'export-metadata.json'].includes(filePath)) {
      return;
    }
    reImportedFiles.push({
      path: filePath,
      content: u8ToString(fileBytes)
    });
  });

  assert.strictEqual(reImportedFiles.length, 2, 'Should have extracted 2 source files');

  const reScannedFiles = reImportedFiles.map((file) => {
    const issues = scanContent(file.content, file.path, DEFAULT_ANALYZE_CONFIG);
    return {
      path: file.path,
      content: file.content,
      issues,
      issueCount: issues.length,
      originalBytes: new TextEncoder().encode(file.content).length
    };
  });

  const finalMetrics = recalculateRepositoryMetrics(reScannedFiles);
  const finalRepoAnalysis: RepositoryAnalysis = {
    files: reScannedFiles,
    totalFiles: reScannedFiles.length,
    ...finalMetrics
  };

  const finalHealthScore = calculateHealthScore(
    finalRepoAnalysis.totalFiles,
    finalRepoAnalysis.totalFixmes,
    finalRepoAnalysis.totalTodos + finalRepoAnalysis.totalConsoleLogs,
    finalRepoAnalysis.totalComments
  );

  // Assertions for clean state
  console.log(`    Final Health Score: ${finalHealthScore}`);
  console.log(`    Final Issues: ${finalRepoAnalysis.totalIssues}`);
  assert.strictEqual(finalRepoAnalysis.totalIssues, 0, 'Re-imported repository should have 0 remaining issues');
  assert.strictEqual(finalHealthScore, 100, 'Re-imported repository health score should be 100');
  
  console.log('  Re-import validation completed successfully!\n');
}

function runAllTests() {
  console.log('Starting repository export and re-import tests...\n');
  try {
    runExportTests();
    testReImportValidation();
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runAllTests();

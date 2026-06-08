import assert from 'node:assert';
import { getIssueSeverity } from '../src/lib/repository/severity';
import { calculateHealthScore } from '../src/lib/repository/health-score';
import { computeLineDiff } from '../src/lib/repository/diff';
import { filterFiles, getTopProblemFiles } from '../src/lib/repository/repository-filters';
import { generateReport } from '../src/lib/repository/report-generator';
import type { RepositoryAnalysis, RepositoryFile } from '../src/types/sanitize';

function testSeverity() {
  console.log('Running: testSeverity');
  assert.strictEqual(getIssueSeverity('fixme'), 'critical');
  assert.strictEqual(getIssueSeverity('todo'), 'warning');
  assert.strictEqual(getIssueSeverity('console_log'), 'warning');
  assert.strictEqual(getIssueSeverity('comment'), 'info');
  // fallback / default
  assert.strictEqual(getIssueSeverity('other' as unknown as 'comment'), 'info');
}

function testHealthScore() {
  console.log('Running: testHealthScore');
  // 100 on 0 files
  assert.strictEqual(calculateHealthScore(0, 0, 0, 0), 100);
  
  // Weights: Critical = 20, Warning = 5, Informational = 1
  // Total files = 10
  // Critical = 1 (penalty = 20), Warning = 2 (penalty = 10), Informational = 5 (penalty = 5)
  // Total penalty = 35 / 10 = 3.5. Score = 100 - 3.5 = 96.5 -> 97 (rounded)
  assert.strictEqual(calculateHealthScore(10, 1, 2, 5), 97);
  
  // Score cannot go below 0
  assert.strictEqual(calculateHealthScore(1, 10, 0, 0), 0);
  
  // Score cannot go above 100
  assert.strictEqual(calculateHealthScore(5, 0, 0, 0), 100);
}

function testDiff() {
  console.log('Running: testDiff');
  const original = "line1\nline2\nline3\nline4";
  const cleaned = "line1\nline3\nline4";
  
  const { left, right } = computeLineDiff(original, cleaned);
  
  // left should have 4 lines, line2 marked as 'removed'
  assert.strictEqual(left.length, 4);
  assert.strictEqual(right.length, 4);
  
  assert.deepStrictEqual(left[0], { type: 'unchanged', content: 'line1', lineNumber: 1 });
  assert.deepStrictEqual(right[0], { type: 'unchanged', content: 'line1', lineNumber: 1 });
  
  assert.deepStrictEqual(left[1], { type: 'removed', content: 'line2', lineNumber: 2 });
  assert.deepStrictEqual(right[1], { type: 'removed', content: '', lineNumber: undefined });
  
  assert.deepStrictEqual(left[2], { type: 'unchanged', content: 'line3', lineNumber: 3 });
  assert.deepStrictEqual(right[2], { type: 'unchanged', content: 'line3', lineNumber: 2 });
}

function testRepositoryFilters() {
  console.log('Running: testRepositoryFilters');
  const files: RepositoryFile[] = [
    { path: 'src/index.ts', content: '...', issues: [], issueCount: 0, originalBytes: 100 },
    { path: 'src/components/Button.tsx', content: '...', issues: [{ type: 'todo', message: 'x', line: 1, rawContent: 'todo' }], issueCount: 1, originalBytes: 200 },
    { path: 'src/utils/helpers.ts', content: '...', issues: [
      { type: 'fixme', message: 'y', line: 1, rawContent: 'fixme' },
      { type: 'comment', message: 'z', line: 2, rawContent: 'comment' }
    ], issueCount: 2, originalBytes: 300 }
  ];
  
  // Filter query
  const filtered = filterFiles(files, 'button');
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].path, 'src/components/Button.tsx');
  
  // Empty or whitespace query returns all
  assert.strictEqual(filterFiles(files, '  ').length, 3);
  
  // Top problem files
  const top = getTopProblemFiles(files, 2);
  assert.strictEqual(top.length, 2);
  assert.strictEqual(top[0].path, 'src/utils/helpers.ts'); // 2 issues
  assert.strictEqual(top[1].path, 'src/components/Button.tsx'); // 1 issue
}

function testReportGenerator() {
  console.log('Running: testReportGenerator');
  const repoAnalysis: RepositoryAnalysis = {
    totalFiles: 2,
    totalIssues: 3,
    totalBytes: 500,
    totalBytesSaved: 50,
    totalComments: 1,
    totalTodos: 1,
    totalFixmes: 1,
    totalConsoleLogs: 0,
    files: [
      {
        path: 'src/index.ts',
        content: 'const x = 1;',
        issues: [{ type: 'comment', message: 'c', line: 1, rawContent: 'comment' }],
        issueCount: 1,
        originalBytes: 100
      },
      {
        path: 'src/app.ts',
        content: 'const y = 2;',
        issues: [
          { type: 'todo', message: 't', line: 1, rawContent: 'todo' },
          { type: 'fixme', message: 'f', line: 2, rawContent: 'fixme' }
        ],
        issueCount: 2,
        originalBytes: 400,
        cleanedContent: 'const y = 2;',
        cleanedBytes: 350
      }
    ]
  };
  
  const report = generateReport('my-repo', repoAnalysis);
  
  // Check JSON format
  const jsonReport = JSON.parse(report.json);
  assert.strictEqual(jsonReport.repositoryName, 'my-repo');
  assert.strictEqual(jsonReport.healthScore, 87);
  assert.strictEqual(jsonReport.summary.totalFiles, 2);
  assert.strictEqual(jsonReport.summary.cleanedFiles, 1);
  assert.strictEqual(jsonReport.summary.totalIssuesRemaining, 3);
  assert.strictEqual(jsonReport.summary.bytesSaved, 50);
  
  // Check Markdown format
  assert.ok(report.markdown.includes('# CodeMelt Sanitize - Repository Clean Report'));
  assert.ok(report.markdown.includes('**Repository Name:** my-repo'));
  assert.ok(report.markdown.includes('**Workspace Health Score:** 87 / 100'));
}

function runAllTests() {
  console.log('Starting Repository Utilities tests...\n');
  try {
    testSeverity();
    testHealthScore();
    testDiff();
    testRepositoryFilters();
    testReportGenerator();
    console.log('\nAll repository utility tests completed successfully!');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runAllTests();

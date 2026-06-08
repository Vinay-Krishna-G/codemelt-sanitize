import assert from 'node:assert';
import { scanContent } from '../src/scanner.js';
import { CleanConfig } from 'codemelt-sanitize-shared';

const defaultConfig: CleanConfig = {
  detectComments: true,
  detectTodos: true,
  detectFixmes: true,
  detectConsoleLogs: true,
  exclude: []
};

function testSingleLineComments() {
  console.log('Running: testSingleLineComments');
  const code = `
    // This is a comment
    const x = 42; // Another inline comment
    # Python style comment
    const y = "hello";
  `;
  
  const jsIssues = scanContent(code, 'test.js', defaultConfig);
  assert.strictEqual(jsIssues.filter(i => i.type === 'comment').length, 2, 'Should detect 2 comments in JS file');
  assert.ok(jsIssues.some(i => i.rawContent.includes('This is a comment')));
  assert.ok(jsIssues.some(i => i.rawContent.includes('Another inline comment')));
  
  const pyIssues = scanContent(code, 'test.py', defaultConfig);
  // Python config should only detect '#' as a comment, and ignore '//' as regular code.
  assert.strictEqual(pyIssues.filter(i => i.type === 'comment').length, 1, 'Should detect 1 comment in Python file');
  assert.ok(pyIssues[0].rawContent.includes('Python style comment'));
}

function testBlockComments() {
  console.log('Running: testBlockComments');
  const code = `
    /* Start of block comment
       middle line
       end of block */
    const test = 1;
    <!-- HTML block comment -->
  `;
  
  const jsIssues = scanContent(code, 'test.js', defaultConfig);
  assert.strictEqual(jsIssues.filter(i => i.type === 'comment').length, 3, 'Should detect 3 comment lines inside JS block comment');
  assert.ok(jsIssues[0].rawContent.includes('Start of block comment'));
  assert.ok(jsIssues[1].rawContent.includes('middle line'));
  assert.ok(jsIssues[2].rawContent.includes('end of block'));
  
  const htmlIssues = scanContent(code, 'test.html', defaultConfig);
  assert.strictEqual(htmlIssues.filter(i => i.type === 'comment').length, 1, 'Should detect 1 comment line in HTML file');
  assert.ok(htmlIssues[0].rawContent.includes('HTML block comment'));
}

function testTodoFixmeDetection() {
  console.log('Running: testTodoFixmeDetection');
  const code = `
    // TODO: implement this feature
    // FIXME: fix this bug ASAP
    // Normal comment
  `;
  
  const issues = scanContent(code, 'test.ts', defaultConfig);
  assert.strictEqual(issues.filter(i => i.type === 'todo').length, 1, 'Should detect 1 TODO issue');
  assert.strictEqual(issues.filter(i => i.type === 'fixme').length, 1, 'Should detect 1 FIXME issue');
  assert.strictEqual(issues.filter(i => i.type === 'comment').length, 1, 'Should detect 1 standard comment');
  
  // Test disabling options
  const disabledConfig: CleanConfig = {
    ...defaultConfig,
    detectTodos: false,
    detectFixmes: false
  };
  const filteredIssues = scanContent(code, 'test.ts', disabledConfig);
  // When TODO/FIXME detection are disabled, they should either be treated as normal comments (if detectComments is true) or ignored.
  assert.strictEqual(filteredIssues.filter(i => i.type === 'todo').length, 0);
  assert.strictEqual(filteredIssues.filter(i => i.type === 'fixme').length, 0);
  assert.strictEqual(filteredIssues.filter(i => i.type === 'comment').length, 3, 'Should fall back to 3 standard comments');
}

function testConsoleLogs() {
  console.log('Running: testConsoleLogs');
  const code = `
    console.log("active log statement");
    const test = "console.log('inside string literal')";
    // console.log("inside comment");
  `;
  
  const issues = scanContent(code, 'test.ts', defaultConfig);
  const logIssues = issues.filter(i => i.type === 'console_log');
  
  assert.strictEqual(logIssues.length, 1, 'Should detect exactly 1 active console.log');
  assert.ok(logIssues[0].rawContent.includes('active log statement'), 'Detected log content should be correct');
  
  const commentIssues = issues.filter(i => i.type === 'comment');
  assert.strictEqual(commentIssues.length, 1, 'Should detect the commented-out console.log as comment');
}

function runAllTests() {
  console.log('Starting CodeMelt Sanitize Scanner tests...\n');
  try {
    testSingleLineComments();
    testBlockComments();
    testTodoFixmeDetection();
    testConsoleLogs();
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runAllTests();

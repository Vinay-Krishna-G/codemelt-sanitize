import assert from 'node:assert';
import { cleanContent } from '../src/cleaner.js';
import { CleanConfig } from 'codemelt-sanitize-shared';

const defaultConfig: CleanConfig = {
  detectComments: true,
  detectTodos: true,
  detectFixmes: true,
  detectConsoleLogs: true,
  exclude: []
};

function testCommentRemoval() {
  console.log('Running: testCommentRemoval');
  const original = [
    '// This is a header comment',
    'const x = 10; // inline comment',
    '/* block comment */',
    'const y = 20;',
    '/* multiline',
    '   block comment */',
    'const z = 30;'
  ].join('\n');

  const expected = [
    '',
    'const x = 10;',
    '',
    'const y = 20;',
    '',
    '',
    'const z = 30;'
  ].join('\n');

  const cleaned = cleanContent(original, 'test.js', defaultConfig);
  assert.strictEqual(cleaned, expected, 'Should strip comments while preserving lines and code');
}

function testTodoFixmeRemoval() {
  console.log('Running: testTodoFixmeRemoval');
  const original = [
    '// TODO: implement feature A',
    '// FIXME: fix issue B',
    '// Normal comment',
    'const test = 1;'
  ].join('\n');

  // If we only remove TODOs
  const todoOnlyConfig: CleanConfig = {
    ...defaultConfig,
    detectComments: false,
    detectFixmes: false,
    detectTodos: true
  };
  const expectedTodoOnly = [
    '',
    '// FIXME: fix issue B',
    '// Normal comment',
    'const test = 1;'
  ].join('\n');
  assert.strictEqual(cleanContent(original, 'test.js', todoOnlyConfig), expectedTodoOnly);

  // If we only remove FIXMEs
  const fixmeOnlyConfig: CleanConfig = {
    ...defaultConfig,
    detectComments: false,
    detectFixmes: true,
    detectTodos: false
  };
  const expectedFixmeOnly = [
    '// TODO: implement feature A',
    '',
    '// Normal comment',
    'const test = 1;'
  ].join('\n');
  assert.strictEqual(cleanContent(original, 'test.js', fixmeOnlyConfig), expectedFixmeOnly);
}

function testConsoleLogRemoval() {
  console.log('Running: testConsoleLogRemoval');
  const original = [
    'console.log("start");',
    'const a = 1; console.log(a); const b = 2;',
    'console.log(',
    '  "multiline log statement"',
    ');',
    'const c = 3;'
  ].join('\n');

  const expected = [
    '',
    'const a = 1;  const b = 2;',
    'console.log(', // preserved because of line-based limitations (documented)
    '  "multiline log statement"', // preserved because of line-based limitations (documented)
    ');',
    'const c = 3;'
  ].join('\n');

  const cleaned = cleanContent(original, 'test.js', defaultConfig);
  assert.strictEqual(cleaned, expected, 'Should safely remove console.log statements');
}

function testStringLiteralsPreservation() {
  console.log('Running: testStringLiteralsPreservation');
  const original = [
    'const url = "https://example.com/api";',
    'const logStr = "console.log(123);";',
    '// actual comment'
  ].join('\n');

  const expected = [
    'const url = "https://example.com/api";',
    'const logStr = "console.log(123);";',
    ''
  ].join('\n');

  const cleaned = cleanContent(original, 'test.js', defaultConfig);
  assert.strictEqual(cleaned, expected, 'Should preserve string contents exactly');
}

function runAllCleanerTests() {
  console.log('Starting CodeMelt Sanitize Cleaner tests...\n');
  try {
    testCommentRemoval();
    testTodoFixmeRemoval();
    testConsoleLogRemoval();
    testStringLiteralsPreservation();
    console.log('\nAll cleaner tests completed successfully!');
  } catch (error) {
    console.error('Cleaner test execution failed:', error);
    process.exit(1);
  }
}

runAllCleanerTests();

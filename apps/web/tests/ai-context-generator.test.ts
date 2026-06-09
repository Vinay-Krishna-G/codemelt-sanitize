import assert from 'node:assert';
import { analyzeRepository } from '../src/lib/repository/intelligence/index';
import { generateAIContext, clearContextCache } from '../src/lib/repository/intelligence/ai-context-generator';
import type { RepositoryFile } from '../src/types/sanitize';
import type { AIContextPreset, AITarget, AIContextExportFormat } from '../src/types/intelligence';

function mockFile(path: string, content: string = '', size: number = 0): RepositoryFile {
  const finalSize = size > 0 ? size : new TextEncoder().encode(content).length;
  return {
    path,
    content,
    issues: [],
    issueCount: 0,
    originalBytes: finalSize
  };
}

// 1. Test Prompt Presets
function testPromptPresets() {
  console.log('Running: testPromptPresets');
  const files = [
    mockFile('src/app/page.tsx', 'Page content'),
    mockFile('package.json', JSON.stringify({ name: 'test-app', dependencies: { react: '19.0.0' } }))
  ];
  const intelligence = analyzeRepository(files, 'test-app');

  const presets: AIContextPreset[] = [
    'bug-fix',
    'feature-dev',
    'refactor',
    'code-review',
    'arch-review',
    'perf-opt',
    'security-review'
  ];

  presets.forEach((preset) => {
    const payload = generateAIContext(intelligence, preset, 'standard', 'chatgpt', 'markdown');
    assert.ok(payload.prompt.includes('Context Action:'));
    assert.ok(payload.prompt.includes('Target LLM Optimization:'));
    assert.strictEqual(payload.preset, preset);
  });
}

// 2. Test Targets Optimization
function testTargetsOptimization() {
  console.log('Running: testTargetsOptimization');
  const files = [mockFile('src/index.ts', 'export {}')];
  const intelligence = analyzeRepository(files, 'test-app');

  const targets: AITarget[] = ['chatgpt', 'claude', 'gemini', 'cursor', 'windsurf', 'copilot'];

  targets.forEach((target) => {
    const payload = generateAIContext(intelligence, 'feature-dev', 'standard', target, 'markdown');
    assert.strictEqual(payload.target, target);
    assert.ok(payload.prompt.length > 0);
  });
}

// 3. Test Length Modes Limits
function testLengthModes() {
  console.log('Running: testLengthModes');
  // Create mock dependencies
  const deps: Record<string, string> = {};
  for (let i = 0; i < 50; i++) {
    deps[`dep-${i}`] = '1.0.0';
  }
  const devDeps: Record<string, string> = {};
  for (let i = 0; i < 30; i++) {
    devDeps[`dev-dep-${i}`] = '1.0.0';
  }

  const files = [
    mockFile('package.json', JSON.stringify({ dependencies: deps, devDependencies: devDeps })),
    mockFile('src/index.ts', 'export {}')
  ];
  const intelligence = analyzeRepository(files, 'test-app');

  // Compact Mode: max 5 dependencies
  const compactPayload = generateAIContext(intelligence, 'bug-fix', 'compact', 'chatgpt', 'json');
  const compactData = JSON.parse(compactPayload.content);
  assert.ok(compactData.productionDependencies.length <= 5);
  assert.strictEqual(compactData.developmentDependencies.length, 0);

  // Standard Mode: max 15 production dependencies
  const standardPayload = generateAIContext(intelligence, 'bug-fix', 'standard', 'chatgpt', 'json');
  const standardData = JSON.parse(standardPayload.content);
  assert.ok(standardData.productionDependencies.length <= 15);
  assert.ok(standardData.developmentDependencies.length <= 8);

  // Detailed Mode: max 25 production and 15 development dependencies
  const detailedPayload = generateAIContext(intelligence, 'bug-fix', 'detailed', 'chatgpt', 'json');
  const detailedData = JSON.parse(detailedPayload.content);
  assert.ok(detailedData.productionDependencies.length <= 25);
  assert.ok(detailedData.developmentDependencies.length <= 15);
}

// 4. Test Token Estimation
function testTokenEstimation() {
  console.log('Running: testTokenEstimation');
  const files = [mockFile('src/index.ts', 'export const a = 42;')];
  const intelligence = analyzeRepository(files, 'test-app');

  const payload = generateAIContext(intelligence, 'bug-fix', 'compact', 'chatgpt', 'markdown');
  const expectedTokens = Math.round(payload.content.length / 4);
  assert.strictEqual(payload.metrics.estimatedTokens, expectedTokens);
}

// 5. Test Caching Layer
function testCachingLayer() {
  console.log('Running: testCachingLayer');
  const files = [mockFile('src/index.ts', 'export {}')];
  const intelligence = analyzeRepository(files, 'test-app');

  clearContextCache();

  const payload1 = generateAIContext(intelligence, 'bug-fix', 'compact', 'chatgpt', 'markdown');
  const payload2 = generateAIContext(intelligence, 'bug-fix', 'compact', 'chatgpt', 'markdown');
  
  // They should be the exact same reference since cache returned it
  assert.strictEqual(payload1, payload2);

  // Changing parameter triggers cache bust
  const payload3 = generateAIContext(intelligence, 'feature-dev', 'compact', 'chatgpt', 'markdown');
  assert.notStrictEqual(payload1, payload3);
}

// 6. Test Formats Serialization
function testFormats() {
  console.log('Running: testFormats');
  const files = [mockFile('src/index.ts', 'export {}')];
  const intelligence = analyzeRepository(files, 'test-app');

  const formats: AIContextExportFormat[] = ['markdown', 'text', 'json'];

  formats.forEach((format) => {
    const payload = generateAIContext(intelligence, 'bug-fix', 'standard', 'chatgpt', format);
    assert.strictEqual(payload.format, format);
    if (format === 'json') {
      const parsed = JSON.parse(payload.content);
      assert.strictEqual(parsed.primaryType, 'Node.js');
    }
  });
}

// 7. Test Empty Repository Handling
function testEmptyRepositoryContext() {
  console.log('Running: testEmptyRepositoryContext');
  const intelligence = analyzeRepository([], 'empty-app');
  const payload = generateAIContext(intelligence, 'bug-fix', 'standard', 'chatgpt', 'markdown');
  assert.ok(payload.content.includes('No entry points detected'));
  assert.strictEqual(payload.metrics.promptReadiness, 66); // Weighted: 80 * 0.4 + 85 * 0.4 + 0 * 0.2 = 66
  assert.ok(payload.metrics.compressionRatio >= 0);
}

// 8. Test Large Monorepo Context Generation Benchmark (1500 files, 100 directories, 40 dependencies)
function testLargeMonorepoContextGeneration() {
  console.log('Running: testLargeMonorepoContextGeneration');
  const files: RepositoryFile[] = [];

  // Generate 1500 mock files distributed across 100 directories
  for (let i = 0; i < 1500; i++) {
    const dirIndex = i % 100;
    files.push(mockFile(`packages/pkg-${dirIndex}/src/file-${i}.ts`, `export const val_${i} = ${i};`));
  }

  // Add package.json with 40 dependencies
  const deps: Record<string, string> = {};
  for (let i = 0; i < 40; i++) {
    deps[`dep-${i}`] = '^1.0.0';
  }
  files.push(mockFile('package.json', JSON.stringify({
    name: 'large-monorepo',
    dependencies: deps,
    devDependencies: {
      typescript: '^5.0.0'
    }
  })));

  const startTime = Date.now();
  const intelligence = analyzeRepository(files, 'large-monorepo');
  const analysisDuration = Date.now() - startTime;
  console.log(`  Intelligence analysis completed in: ${analysisDuration}ms`);

  const contextStartTime = Date.now();
  // Detailed Mode Context Package
  const payload = generateAIContext(intelligence, 'bug-fix', 'detailed', 'chatgpt', 'markdown');
  const contextDuration = Date.now() - contextStartTime;
  console.log(`  Context generation completed in: ${contextDuration}ms`);

  // Assertions
  assert.ok(payload.content.length > 0);
  assert.ok(payload.metrics.wordCount > 100);
  assert.ok(payload.metrics.estimatedTokens > 0);
  assert.strictEqual(payload.metrics.completeness, 100);
  
  // Verify detailed mode list limits are applied (top 25 production, top 15 dev)
  assert.ok(payload.content.includes('dep-30'));
  assert.ok(!payload.content.includes('dep-31')); // Should be sliced off at 25 (dep-31 is the 26th alphabetically)

  assert.ok(contextDuration < 100, `Context generation took too long: ${contextDuration}ms (target: < 100ms)`);
}

function runAllContextTests() {
  console.log('Starting Phase 6B AI Context Export System tests...\n');
  try {
    testPromptPresets();
    testTargetsOptimization();
    testLengthModes();
    testTokenEstimation();
    testCachingLayer();
    testFormats();
    testEmptyRepositoryContext();
    testLargeMonorepoContextGeneration();
    console.log('\nAll Phase 6B AI Context tests completed successfully!');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runAllContextTests();

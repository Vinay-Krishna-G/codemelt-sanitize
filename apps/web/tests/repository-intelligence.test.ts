import assert from 'node:assert';
import { analyzeRepository, calculateComplexity } from '../src/lib/repository/intelligence/index';
import type { RepositoryFile } from '../src/types/sanitize';

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

// 1. Empty Repository Test
function testEmptyRepository() {
  console.log('Running: testEmptyRepository');
  const files: RepositoryFile[] = [];
  const result = analyzeRepository(files, 'empty-repo');
  
  assert.strictEqual(result.primaryType, 'Unknown');
  assert.strictEqual(result.repositoryStats.totalFiles, 0);
  assert.strictEqual(result.repositoryStats.totalDirectories, 0);
  assert.strictEqual(result.workspaceCount, 0);
}

// 2. Unsupported Repository Test
function testUnsupportedRepository() {
  console.log('Running: testUnsupportedRepository');
  const files = [
    mockFile('readme.txt', 'Hello world'),
    mockFile('notes.md', '# Notes'),
    mockFile('data.csv', '1,2,3')
  ];
  const result = analyzeRepository(files, 'unsupported-repo');
  
  assert.strictEqual(result.primaryType, 'Unknown');
  assert.strictEqual(result.repositoryStats.totalFiles, 3);
  assert.strictEqual(result.repositoryStats.totalDirectories, 0);
}

// 3. Next.js Repository Test
function testNextjsRepository() {
  console.log('Running: testNextjsRepository');
  const files = [
    mockFile('next.config.ts', 'export default {};'),
    mockFile('src/app/page.tsx', 'export default function Page() { return <div>Home</div>; }'),
    mockFile('package.json', JSON.stringify({
      dependencies: {
        'next': '16.0.0',
        'react': '19.0.0',
        'react-dom': '19.0.0'
      }
    }))
  ];
  const result = analyzeRepository(files, 'next-app');

  assert.strictEqual(result.primaryType, 'Next.js');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Next.js' && t.confidence === 100 && t.confidenceLevel === 'high'));
  assert.ok(result.detectedTechnologies.some(t => t.type === 'React' && t.confidence === 100 && t.confidenceLevel === 'high'));
  assert.ok(result.frameworks.some(f => f.name === 'Next.js' && f.confidence === 100));
  assert.ok(result.entryPoints.some(e => e.path === 'src/app/page.tsx' && e.type === 'Page'));
  assert.strictEqual(result.repositoryPurpose.purpose, 'Web Application Frontend');
}

// 4. Vite React Repository Test
function testViteReactRepository() {
  console.log('Running: testViteReactRepository');
  const files = [
    mockFile('vite.config.ts', 'export default {};'),
    mockFile('src/main.tsx', 'import React from "react";'),
    mockFile('package.json', JSON.stringify({
      dependencies: {
        'react': '19.0.0'
      }
    }))
  ];
  const result = analyzeRepository(files, 'react-app');

  assert.strictEqual(result.primaryType, 'React');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'React' && t.confidence === 100));
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Node.js' && t.confidence === 100));
}

// 5. Node CLI Repository Test
function testNodeCliRepository() {
  console.log('Running: testNodeCliRepository');
  const files = [
    mockFile('bin/cli.js', '#!/usr/bin/env node'),
    mockFile('package.json', JSON.stringify({
      name: 'my-cli',
      bin: {
        'my-cli': 'bin/cli.js'
      },
      dependencies: {
        'commander': '^10.0.0'
      }
    }))
  ];
  const result = analyzeRepository(files, 'cli-repo');

  assert.strictEqual(result.primaryType, 'Node.js');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Node.js' && t.confidence === 100));
  assert.strictEqual(result.repositoryPurpose.purpose, 'CLI Tool');
  assert.ok(result.entryPoints.some(e => e.path === 'bin/cli.js' && e.type === 'CLI Binary'));
}

// 5b. Node Tooling-Only (package.json exists but no source files)
function testNodeToolingRepository() {
  console.log('Running: testNodeToolingRepository');
  const files = [
    mockFile('package.json', JSON.stringify({
      name: 'tooling-package',
      main: 'index.js',
      dependencies: {
        'rimraf': '^5.0.0'
      }
    }))
  ];
  const result = analyzeRepository(files, 'tooling-repo');

  assert.strictEqual(result.primaryType, 'Node.js');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Node.js' && t.confidence === 60 && t.confidenceLevel === 'low'));
  assert.strictEqual(result.repositoryPurpose.purpose, 'Shared Library');
}

// 6. Python Repository Test
function testPythonRepository() {
  console.log('Running: testPythonRepository');
  const files = [
    mockFile('requirements.txt', 'fastapi\nuvicorn'),
    mockFile('main.py', 'from fastapi import FastAPI\napp = FastAPI()'),
    mockFile('app.py', 'print("App")')
  ];
  const result = analyzeRepository(files, 'python-app');

  assert.strictEqual(result.primaryType, 'Python');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Python' && t.confidence === 100));
  assert.ok(result.entryPoints.some(e => e.path === 'main.py' && e.type === 'Executable Entry'));
  assert.strictEqual(result.repositoryPurpose.purpose, 'Backend API Server');
}

// 7. Monorepo Repository Test
function testMonorepoRepository() {
  console.log('Running: testMonorepoRepository');
  const files = [
    mockFile('pnpm-workspace.yaml', 'packages:\n  - "apps/*"\n  - "packages/*"'),
    mockFile('pnpm-lock.yaml', 'lockfileVersion: 5.4'),
    mockFile('apps/web/package.json', JSON.stringify({ name: 'web' })),
    mockFile('packages/core/package.json', JSON.stringify({ name: 'core' })),
    mockFile('packages/shared/package.json', JSON.stringify({ name: 'shared' })),
    mockFile('package.json', JSON.stringify({ name: 'root' }))
  ];
  const result = analyzeRepository(files, 'monorepo-workspace');

  assert.strictEqual(result.primaryType, 'Monorepo');
  assert.strictEqual(result.packageManager, 'pnpm');
  assert.strictEqual(result.workspaceCount, 3);
  assert.strictEqual(result.repositoryPurpose.purpose, 'Multi-package Platform');
}

// 8. Static HTML Repository Test
function testStaticHtmlRepository() {
  console.log('Running: testStaticHtmlRepository');
  const files = [
    mockFile('index.html', '<html></html>'),
    mockFile('style.css', 'body {}'),
    mockFile('script.js', 'console.log("hello")')
  ];
  const result = analyzeRepository(files, 'static-website');

  assert.strictEqual(result.primaryType, 'Static HTML');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Static HTML' && t.confidence === 100));
  assert.strictEqual(result.repositoryPurpose.purpose, 'Software Project');
}

// 9. Mixed Monorepo Test
function testMixedMonorepoRepository() {
  console.log('Running: testMixedMonorepoRepository');
  const files = [
    mockFile('package.json', JSON.stringify({
      workspaces: ['apps/*', 'packages/*']
    })),
    mockFile('apps/web/package.json', JSON.stringify({
      dependencies: {
        'next': '^15.0.0',
        'react': '^19.0.0'
      }
    })),
    mockFile('apps/web/src/app/page.tsx', 'const Page = () => null; export default Page;'),
    mockFile('packages/core/package.json', JSON.stringify({
      name: 'core',
      main: 'dist/index.js'
    })),
    mockFile('packages/core/src/index.ts', 'export const Core = 42;'),
    mockFile('packages/shared/package.json', JSON.stringify({
      name: 'shared'
    })),
    mockFile('package-lock.json', '{}')
  ];
  const result = analyzeRepository(files, 'codemelt-sanitize');

  assert.strictEqual(result.primaryType, 'Monorepo');
  assert.strictEqual(result.packageManager, 'npm');
  assert.strictEqual(result.workspaceCount, 3);
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Next.js' && t.confidence === 95));
  assert.ok(result.detectedTechnologies.some(t => t.type === 'React' && t.confidence === 100));
}

// 10. Large Repository Simulation (1000 files)
function testLargeRepositorySimulation() {
  console.log('Running: testLargeRepositorySimulation (1000 files)');
  const files: RepositoryFile[] = [];
  
  for (let i = 0; i < 600; i++) {
    files.push(mockFile(`src/components/Button${i}.tsx`, `export const Button${i} = () => null;`));
  }
  for (let i = 0; i < 100; i++) {
    files.push(mockFile(`src/utils/helper${i}.ts`, `export function helper${i}() {}`));
  }
  for (let i = 0; i < 200; i++) {
    files.push(mockFile(`config/settings/config${i}.json`, `{"id": ${i}}`));
  }
  for (let i = 0; i < 50; i++) {
    files.push(mockFile(`src/styles/theme${i}.css`, `:root { --theme-${i}: #000; }`));
  }
  for (let i = 0; i < 50; i++) {
    files.push(mockFile(`docs/guide${i}.md`, `# Guide ${i}`));
  }

  files.push(mockFile('package.json', JSON.stringify({
    dependencies: {
      'next': '16.0.0',
      'react': '19.0.0'
    }
  })));
  files.push(mockFile('next.config.ts', 'export default {};'));

  const startTime = Date.now();
  const result = analyzeRepository(files, 'large-simulate');
  const duration = Date.now() - startTime;

  console.log(`  Analysis completed in: ${duration}ms`);
  
  assert.strictEqual(result.repositoryStats.totalFiles, 1002);
  assert.strictEqual(result.primaryType, 'Next.js');
  assert.ok(duration < 150, `Analysis took too long: ${duration}ms (target: < 150ms)`);
}

// 11. Lockfile Precedence Checks
function testLockfilePrecedence() {
  console.log('Running: testLockfilePrecedence');
  
  const filesPnpm = [mockFile('pnpm-lock.yaml'), mockFile('bun.lockb'), mockFile('yarn.lock'), mockFile('package-lock.json')];
  assert.strictEqual(analyzeRepository(filesPnpm, 't').packageManager, 'pnpm');

  const filesBun = [mockFile('bun.lockb'), mockFile('yarn.lock'), mockFile('package-lock.json')];
  assert.strictEqual(analyzeRepository(filesBun, 't').packageManager, 'bun');

  const filesYarn = [mockFile('yarn.lock'), mockFile('package-lock.json')];
  assert.strictEqual(analyzeRepository(filesYarn, 't').packageManager, 'yarn');

  const filesNpm = [mockFile('package-lock.json')];
  assert.strictEqual(analyzeRepository(filesNpm, 't').packageManager, 'npm');
}

// 12. Exclusions of layout.tsx and Entry Point priorities
function testEntryPointsExclusionsAndPriorities() {
  console.log('Running: testEntryPointsExclusionsAndPriorities');
  const files = [
    mockFile('src/app/layout.tsx', 'Layout'),
    mockFile('src/app/page.tsx', 'Page'),
    mockFile('src/app/api/route.ts', 'Route'),
    mockFile('src/middleware.ts', 'Middleware'),
    mockFile('src/index.ts', 'Index'), // matches package-root src/index.ts tightened rule
    mockFile('index.html', 'HTML')
  ];
  const result = analyzeRepository(files, 'test-app');

  assert.ok(!result.entryPoints.some(e => e.path.endsWith('layout.tsx')));

  assert.strictEqual(result.entryPoints[0].type, 'Page');
  assert.strictEqual(result.entryPoints[1].type, 'API Route');
  assert.strictEqual(result.entryPoints[2].type, 'Middleware');
  assert.strictEqual(result.entryPoints[3].type, 'Library Entry');
  assert.strictEqual(result.entryPoints[4].type, 'Static HTML');
}

// 13. Complexity Benchmark Scoring Calibrations (Exact matches)
function testComplexityBenchmarks() {
  console.log('Running: testComplexityBenchmarks');

  // 1. Tiny Repo (Benchmark: Exact 17)
  const scoreTiny = calculateComplexity(3, 0, 15360, 0);
  assert.strictEqual(scoreTiny, 17);

  // 2. Small App (Benchmark: Exact 37)
  const scoreSmall = calculateComplexity(25, 3, 102400, 0);
  assert.strictEqual(scoreSmall, 37);

  // 3. Medium SaaS (Benchmark: Exact 54)
  const scoreMedium = calculateComplexity(120, 12, 1258291, 0);
  assert.strictEqual(scoreMedium, 54);

  // 4. Large Monorepo (Benchmark: Exact 69)
  const scoreLarge = calculateComplexity(400, 40, 8388608, 0);
  assert.strictEqual(scoreLarge, 69);

  // 5. Enterprise (Benchmark: Exact 85)
  const scoreEnterprise = calculateComplexity(1500, 150, 52428800, 0);
  assert.strictEqual(scoreEnterprise, 85);
}

// 14. False Positive Next.js Check
function testFalsePositiveNextjs() {
  console.log('Running: testFalsePositiveNextjs');
  const files = [
    mockFile('src/components/next-button/button.tsx', 'React Component'),
    mockFile('package.json', JSON.stringify({
      dependencies: {
        'react': '^19.0.0'
      }
    }))
  ];
  const result = analyzeRepository(files, 'test-app');
  assert.strictEqual(result.primaryType, 'React');
  assert.ok(!result.detectedTechnologies.some(t => t.type === 'Next.js'));
}

// 15. Mixed Python + React check
function testMixedPythonReact() {
  console.log('Running: testMixedPythonReact');
  const files = [
    mockFile('requirements.txt', 'fastapi'),
    mockFile('main.py', 'app = FastAPI()'),
    mockFile('package.json', JSON.stringify({
      dependencies: {
        'react': '^19.0.0'
      }
    }))
  ];
  const result = analyzeRepository(files, 'mixed-app');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Python' && t.confidence === 100));
  assert.ok(result.detectedTechnologies.some(t => t.type === 'React' && t.confidence === 100));
}

// 16. Nodes confidence fallback without package.json
function testNoPackageJsonNodeFallback() {
  console.log('Running: testNoPackageJsonNodeFallback');
  const files = [
    mockFile('src/index.ts', 'console.log("no package json");')
  ];
  const result = analyzeRepository(files, 'no-pkg-json');
  assert.strictEqual(result.primaryType, 'Node.js');
  assert.ok(result.detectedTechnologies.some(t => t.type === 'Node.js' && t.confidence === 50));
}

// 17. Diagnostics warnings auditing (deduplicated stacks)
function testDiagnosticsWarnings() {
  console.log('Running: testDiagnosticsWarnings');

  // 1. Lockfile warning
  const resultLock = analyzeRepository([
    mockFile('package-lock.json', '{}'),
    mockFile('pnpm-lock.yaml', '')
  ], 'lock-app');
  assert.ok(resultLock.analysisWarnings.some(w => w.includes('Multiple lockfiles')));

  // 2. Mixed tech stack warning (Crossing ecosystems: Go + Python)
  const resultMixed = analyzeRepository([
    mockFile('go.mod', 'module test'),
    mockFile('requirements.txt', 'fastapi')
  ], 'mixed-app');
  assert.ok(resultMixed.analysisWarnings.some(w => w.includes('Mixed tech stack')));

  // 2b. Compatible stacks group test (Next.js + React + Monorepo - should NOT trigger mixed tech warning)
  const resultCompatible = analyzeRepository([
    mockFile('package.json', JSON.stringify({
      workspaces: ['apps/*'],
      dependencies: { 'next': '16.0.0', 'react': '19.0.0' }
    })),
    mockFile('apps/web/package.json', '{}'),
    mockFile('next.config.ts', 'export default {}')
  ], 'compatible-app');
  assert.ok(!resultCompatible.analysisWarnings.some(w => w.includes('Mixed tech stack')));

  // 3. Missing entry point warning
  const resultMissing = analyzeRepository([
    mockFile('some-random-file.txt', '')
  ], 'missing-app');
  assert.ok(resultMissing.analysisWarnings.some(w => w.includes('No reliable system entry points')));

  // 4. Low confidence warning
  const resultLow = analyzeRepository([
    mockFile('package.json', '{}')
  ], 'low-conf-app');
  assert.ok(resultLow.analysisWarnings.some(w => w.includes('low confidence')));
}

// 18. Evidence Generation validation
function testEvidenceGeneration() {
  console.log('Running: testEvidenceGeneration');
  const files = [
    mockFile('pnpm-workspace.yaml', 'packages:\n  - "packages/*"'),
    mockFile('package.json', JSON.stringify({ name: 'monorepo' }))
  ];
  const result = analyzeRepository(files, 'evidence-repo');
  const monorepoTech = result.detectedTechnologies.find(t => t.type === 'Monorepo');
  assert.ok(monorepoTech);
  assert.ok(monorepoTech.evidence.length > 0);
  assert.ok(monorepoTech.evidence.some(e => e.includes('pnpm-workspace.yaml')));
}

// 19. Monorepo internal dependencies & wildcard/file/link filters
function testDependencyFiltering() {
  console.log('Running: testDependencyFiltering');
  const files = [
    mockFile('package.json', JSON.stringify({
      dependencies: {
        'react': '19.0.0',
        '@codemelt/core': 'workspace:*',
        '@codemelt/shared': '*',
        'my-local-package': 'file:../local',
        'link-package': 'link:../link'
      }
    })),
    mockFile('packages/core/package.json', JSON.stringify({ name: '@codemelt/core' })),
    mockFile('packages/shared/package.json', JSON.stringify({ name: '@codemelt/shared' }))
  ];
  const result = analyzeRepository(files, 'deps-filter-app');
  
  assert.ok(result.productionDependencies.some(d => d.name === 'react'));
  assert.ok(!result.productionDependencies.some(d => [
    '@codemelt/core',
    '@codemelt/shared',
    'my-local-package',
    'link-package'
  ].includes(d.name)));
}

// 20. Monorepo entry points prioritization check
function testMonorepoEntryPoints() {
  console.log('Running: testMonorepoEntryPoints');
  const files = [
    mockFile('apps/web/package.json', JSON.stringify({ name: 'web' })),
    mockFile('apps/web/src/app/page.tsx', 'Page'),
    mockFile('packages/core/package.json', JSON.stringify({ name: 'core' })),
    mockFile('packages/core/src/index.ts', 'Index'),
    mockFile('packages/shared/package.json', JSON.stringify({ name: 'shared' })),
    mockFile('packages/shared/src/index.ts', 'Index'),
    mockFile('packages/cli/package.json', JSON.stringify({ name: 'cli' })),
    mockFile('packages/cli/src/index.ts', 'Index')
  ];
  const result = analyzeRepository(files, 'monorepo-entries');

  assert.strictEqual(result.entryPoints[0].type, 'Page');
  assert.strictEqual(result.entryPoints[0].path, 'apps/web/src/app/page.tsx');
  assert.strictEqual(result.entryPoints[1].type, 'Library Entry');
  assert.strictEqual(result.entryPoints[2].type, 'Library Entry');
  assert.strictEqual(result.entryPoints[3].type, 'Library Entry');
}

// 21. Expanded library entry points check
function testExpandedLibraryEntrypoints() {
  console.log('Running: testExpandedLibraryEntrypoints');
  const files = [
    mockFile('src/index.ts', 'export {}'),
    mockFile('src/index.js', 'export {}'),
    mockFile('src/index.tsx', 'export {}'),
    mockFile('src/index.jsx', 'export {}'),
    mockFile('packages/a/src/index.tsx', 'export {}'),
    mockFile('packages/b/src/index.jsx', 'export {}'),
    mockFile('packages/c/nested/src/index.tsx', 'export {}') // nested subdirectory, should NOT be library entry
  ];
  const result = analyzeRepository(files, 'expanded-lib-entries');

  const libraryEntries = result.entryPoints.filter(e => e.type === 'Library Entry');
  assert.strictEqual(libraryEntries.length, 6);
  assert.ok(libraryEntries.some(e => e.path === 'src/index.ts'));
  assert.ok(libraryEntries.some(e => e.path === 'src/index.js'));
  assert.ok(libraryEntries.some(e => e.path === 'src/index.tsx'));
  assert.ok(libraryEntries.some(e => e.path === 'src/index.jsx'));
  assert.ok(libraryEntries.some(e => e.path === 'packages/a/src/index.tsx'));
  assert.ok(libraryEntries.some(e => e.path === 'packages/b/src/index.jsx'));
  assert.ok(!libraryEntries.some(e => e.path === 'packages/c/nested/src/index.tsx'));
}

// 22. Analysis confidence calculation & penalties checks
function testAnalysisConfidencePenalties() {
  console.log('Running: testAnalysisConfidencePenalties');

  // Case 1: No entry points (-15), no detected technologies (-20), purpose confidence < 60 (-10)
  // empty repo: techAverage=0, purposeConfidence=50, entryCertainty=50, depCertainty=60
  // base score = round((0 + 50 + 50 + 60)/4) = 40.
  // penalties: -15, -20, -10. Score = 40 - 45 = -5 => clamped to 0.
  const emptyRes = analyzeRepository([], 'empty-conf');
  assert.strictEqual(emptyRes.analysisConfidence, 0);

  // Case 2: Has entry points (+100, no -15 penalty), has detected tech (+100, no -20 penalty), high purpose confidence (+100, no -10 penalty), has dependencies (+100)
  const filesFull = [
    mockFile('src/app/page.tsx', 'Page'),
    mockFile('package.json', JSON.stringify({
      dependencies: {
        'next': '^15.0.0',
        'react': '^19.0.0'
      }
    })),
    mockFile('next.config.ts', 'export default {}')
  ];
  const fullRes = analyzeRepository(filesFull, 'full-conf');
  // techAverage: Next.js (100) + React (100) + Node.js (100) = 100
  // purpose: Web Application Frontend (confidence: 85)
  // entry: Page present (100)
  // dependencies: react, next present (100)
  // base score = round((100 + 85 + 100 + 100) / 4) = 96.
  // penalties: None (has entries, has tech, purpose 85 >= 60). Clamped to 96.
  assert.strictEqual(fullRes.analysisConfidence, 96);
}

function runAllTests() {
  console.log('Starting Repository Intelligence Refinement tests...\n');
  try {
    testEmptyRepository();
    testUnsupportedRepository();
    testNextjsRepository();
    testViteReactRepository();
    testNodeCliRepository();
    testNodeToolingRepository();
    testPythonRepository();
    testMonorepoRepository();
    testStaticHtmlRepository();
    testMixedMonorepoRepository();
    testLargeRepositorySimulation();
    testLockfilePrecedence();
    testEntryPointsExclusionsAndPriorities();
    testComplexityBenchmarks();
    testFalsePositiveNextjs();
    testMixedPythonReact();
    testNoPackageJsonNodeFallback();
    testDiagnosticsWarnings();
    testEvidenceGeneration();
    testDependencyFiltering();
    testMonorepoEntryPoints();
    testExpandedLibraryEntrypoints();
    testAnalysisConfidencePenalties();
    console.log('\nAll repository intelligence tests completed successfully!');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runAllTests();

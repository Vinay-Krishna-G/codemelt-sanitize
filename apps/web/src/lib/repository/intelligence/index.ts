import type { RepositoryFile } from '../../../types/sanitize';
import type { 
  RepositoryIntelligence, 
  ProjectType, 
  DependencyEntry,
  RepositoryFingerprint
} from '../../../types/intelligence';
import { PRODUCT_VERSION } from '../../branding';

import { detectPackageManager, detectTechnologiesAndFrameworks } from './technology-detector';
import { detectEntryPoints } from './entrypoint-detector';
import { detectPurpose } from './purpose-detector';
import { calculateLanguageBreakdown } from './language-analyzer';
import { generateAIOverview } from './overview-generator';

interface PackageJson {
  name?: string;
  version?: string;
  main?: string;
  module?: string;
  bin?: string | Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

// Infrastructure directories to exclude from coreDirectories and counting
const DIRECTORY_EXCLUSIONS = new Set([
  '.git',
  '.github',
  '.vscode',
  '.idea',
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  'out'
]);

const COMPATIBLE_STACK_GROUPS: string[][] = [
  ['Monorepo', 'Next.js', 'React', 'Node.js', 'Static HTML'],
  ['Python'],
  ['Go'],
  ['Rust']
];

function areTechnologiesCompatible(techA: string, techB: string): boolean {
  for (const group of COMPATIBLE_STACK_GROUPS) {
    if (group.includes(techA) && group.includes(techB)) {
      return true;
    }
  }
  return false;
}

/**
 * Filter function to skip tooling and type dependency packages in UI listings.
 */
export function shouldDisplayDependency(name: string): boolean {
  const normalized = name.toLowerCase();
  return !(
    normalized.startsWith('@types/') ||
    normalized.startsWith('@typescript-eslint/') ||
    [
      'eslint', 'eslint-config-next', 'prettier', 'jest', 'vitest', 
      'lint-staged', 'husky', 'rimraf', 'tsx', 'ts-node', 
      'webpack', 'rollup', 'postcss', 'autoprefixer', 'typescript'
    ].includes(normalized)
  );
}

/**
 * Recalculate complexity using logarithmic benchmarks.
 */
export function calculateComplexity(
  files: number, 
  directories: number, 
  bytes: number, 
  issues: number
): number {
  if (files === 0) return 0;
  
  const filesFactor = Math.log2(files + 1) * 4.5;
  const dirsFactor = directories > 0 ? Math.log2(directories + 1) * 3.0 : 0;
  const sizeFactor = bytes > 0 ? Math.log10(bytes + 1) * 2.0 : 0;
  const issuesFactor = Math.min(10, issues * 0.2);
  
  const score = Math.round(filesFactor + dirsFactor + sizeFactor + issuesFactor);
  return Math.min(100, Math.max(1, score));
}

/**
 * Extract filtered runtime and dev dependencies.
 */
function extractDependencies(
  depsMap: Record<string, string>,
  internalPackages: Set<string>
): DependencyEntry[] {
  return Object.entries(depsMap)
    .filter(([name, version]) => {
      if (!shouldDisplayDependency(name)) return false;
      if (internalPackages.has(name)) return false;
      
      const v = version.toLowerCase();
      if (
        v === '*' ||
        v.startsWith('workspace:') ||
        v.startsWith('file:') ||
        v.startsWith('link:')
      ) {
        return false;
      }
      return true;
    })
    .map(([name, version]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extract repository version and source.
 */
function extractRepositoryVersion(files: RepositoryFile[]): {
  version: string;
  source: 'package.json' | 'Cargo.toml' | 'pyproject.toml' | 'unknown';
} {
  const rootPkg = files.find(f => f.path === 'package.json');
  if (rootPkg) {
    try {
      const data = JSON.parse(rootPkg.content);
      if (data.version) {
        return { version: data.version, source: 'package.json' };
      }
    } catch {}
  }
  const cargo = files.find(f => f.path === 'Cargo.toml');
  if (cargo) {
    const match = cargo.content.match(/version\s*=\s*"([^"]+)"/);
    if (match) {
      return { version: match[1], source: 'Cargo.toml' };
    }
  }
  const pyproject = files.find(f => f.path === 'pyproject.toml');
  if (pyproject) {
    const match = pyproject.content.match(/version\s*=\s*"([^"]+)"/);
    if (match) {
      return { version: match[1], source: 'pyproject.toml' };
    }
  }
  const anyPkg = files.find(f => f.path.endsWith('package.json'));
  if (anyPkg) {
    try {
      const data = JSON.parse(anyPkg.content);
      if (data.version) {
        return { version: data.version, source: 'package.json' };
      }
    } catch {}
  }
  return { version: '0.1.0', source: 'unknown' };
}

/**
 * Main Repository Intelligence engine analyzer.
 */
export function analyzeRepository(
  files: RepositoryFile[],
  repoName: string,
  healthScore: number = 100
): RepositoryIntelligence {
  const totalFiles = files.length;

  if (totalFiles === 0) {
    return createEmptyIntelligence();
  }

  // 1. Gather stats and directory counts
  const { totalDirectories, coreDirectories, packageFolders } = scanDirectoriesAndPaths(files);
  const totalBytes = files.reduce((acc, f) => acc + f.originalBytes, 0);

  const packageJsonFiles = files.filter((f) => f.path.endsWith('package.json'));

  // 3. Extract and aggregate dependencies
  let packageJsonData: PackageJson | null = null;
  const prodDepsMap: Record<string, string> = {};
  const devDepsMap: Record<string, string> = {};

  const internalPackages = new Set<string>();
  for (const file of packageJsonFiles) {
    try {
      const data = JSON.parse(file.content);
      if (data.name) {
        internalPackages.add(data.name);
      }
      
      const isRoot = !file.path.includes('/');
      if (isRoot || !packageJsonData) {
        packageJsonData = data;
      }
      
      if (data.dependencies) {
        Object.assign(prodDepsMap, data.dependencies);
      }
      if (data.devDependencies) {
        Object.assign(devDepsMap, data.devDependencies);
      }
    } catch {}
  }

  const workspaceCount = packageFolders.length;

  // 4. Package Manager detection
  const packageManager = detectPackageManager(files);

  // 5. Detect technologies and frameworks
  const { detectedTechnologies, frameworks } = detectTechnologiesAndFrameworks(
    files,
    packageJsonFiles,
    prodDepsMap,
    devDepsMap,
    workspaceCount
  );

  // 6. Determine Primary Type
  let primaryType: ProjectType = 'Unknown';
  if (detectedTechnologies.length > 0) {
    const sorted = [...detectedTechnologies].sort((a, b) => b.confidence - a.confidence);
    primaryType = sorted[0].type;
  }

  // 7. Find entry points
  const entryPoints = detectEntryPoints(files, packageJsonData);

  // 8. Dependency mapping
  const productionDependencies = extractDependencies(prodDepsMap, internalPackages).slice(0, 25);
  const developmentDependencies = extractDependencies(devDepsMap, internalPackages).slice(0, 15);

  // 9. Language breakdowns
  const languageBreakdown = calculateLanguageBreakdown(files);

  // 10. Repository Purpose explainability
  const repositoryPurpose = detectPurpose(primaryType, files, prodDepsMap, coreDirectories);

  // 11. Version Extraction
  const verInfo = extractRepositoryVersion(files);

  // 11b. Fingerprint Metadata
  const repositoryFingerprint: RepositoryFingerprint = {
    packageManager,
    primaryType,
    workspaceCount,
    languages: languageBreakdown.map(l => l.language),
    repositoryVersion: verInfo.version,
    versionSource: verInfo.source
  };

  // 12. Complexity scoring
  const totalIssues = files.reduce((acc, f) => acc + f.issues.length, 0);
  const complexityScore = calculateComplexity(totalFiles, totalDirectories, totalBytes, totalIssues);

  // 13. Warnings Engine Audit
  const analysisWarnings: string[] = [];

  // Check multiple lockfiles
  const fileNames = files.map(f => f.path.split('/').pop());
  const foundLockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'].filter(lock => fileNames.includes(lock));
  if (foundLockfiles.length > 1) {
    analysisWarnings.push(`Multiple lockfiles detected: [${foundLockfiles.join(', ')}]. Conflicts might occur.`);
  }

  // Check mixed tech stacks (only warn if Crossing distinct ecosystems)
  const majorStackTypes = detectedTechnologies.filter(t => t.confidenceLevel === 'high');
  let hasMixedStackConflict = false;
  for (let i = 0; i < majorStackTypes.length; i++) {
    for (let j = i + 1; j < majorStackTypes.length; j++) {
      if (!areTechnologiesCompatible(majorStackTypes[i].type, majorStackTypes[j].type)) {
        hasMixedStackConflict = true;
        break;
      }
    }
    if (hasMixedStackConflict) break;
  }
  if (hasMixedStackConflict) {
    analysisWarnings.push(`Mixed tech stack detected: [${majorStackTypes.map(t => t.type).join(', ')}].`);
  }

  // Check missing entry points
  if (entryPoints.length === 0) {
    analysisWarnings.push('No reliable system entry points were discovered.');
  }

  // Check low confidence levels
  const primaryTech = detectedTechnologies.find(t => t.type === primaryType);
  if (primaryTech && primaryTech.confidence < 70) {
    analysisWarnings.push(`Primary stack detection has low confidence: ${primaryType} (${primaryTech.confidence}%).`);
  }

  // 13b. Compute analysisConfidence
  let techAverage = 0;
  if (detectedTechnologies.length > 0) {
    const sum = detectedTechnologies.reduce((acc, t) => acc + t.confidence, 0);
    techAverage = sum / detectedTechnologies.length;
  }
  const purposeConfidence = repositoryPurpose.confidence;
  const entryCertainty = entryPoints.length > 0 ? 100 : 50;
  const depCertainty = (productionDependencies.length > 0 || developmentDependencies.length > 0) ? 100 : 60;

  let confidenceScore = Math.round(
    (techAverage + purposeConfidence + entryCertainty + depCertainty) / 4
  );

  // Apply penalties
  if (entryPoints.length === 0) {
    confidenceScore -= 15;
  }
  if (detectedTechnologies.length === 0) {
    confidenceScore -= 20;
  }
  if (purposeConfidence < 60) {
    confidenceScore -= 10;
  }

  const analysisConfidence = Math.min(100, Math.max(0, confidenceScore));

  // 14. Markdown overview generator
  const overviewMarkdown = generateAIOverview(
    repoName,
    primaryType,
    detectedTechnologies,
    frameworks,
    packageManager,
    entryPoints,
    coreDirectories,
    packageFolders,
    productionDependencies,
    developmentDependencies,
    languageBreakdown,
    repositoryPurpose,
    complexityScore,
    totalFiles,
    totalDirectories,
    totalBytes,
    healthScore,
    analysisWarnings
  );

  return {
    primaryType,
    detectedTechnologies,
    frameworks,
    packageManager,
    workspaceCount,
    entryPoints,
    coreDirectories,
    packageFolders,
    productionDependencies,
    developmentDependencies,
    repositoryStats: {
      totalFiles,
      totalDirectories,
      totalBytes
    },
    languageBreakdown,
    repositoryPurpose,
    repositoryFingerprint,
    complexityScore,
    analysisWarnings,
    analysisConfidence,
    intelligenceSchemaVersion: '2.0',
    generatedAt: new Date().toISOString(),
    analyzerVersion: PRODUCT_VERSION,
    overviewMarkdown
  };
}

/**
 * Fallback empty intelligence payload.
 */
export function createEmptyIntelligence(): RepositoryIntelligence {
  return {
    primaryType: 'Unknown',
    detectedTechnologies: [],
    frameworks: [],
    packageManager: 'unknown',
    workspaceCount: 0,
    entryPoints: [],
    coreDirectories: [],
    packageFolders: [],
    productionDependencies: [],
    developmentDependencies: [],
    repositoryStats: {
      totalFiles: 0,
      totalDirectories: 0,
      totalBytes: 0
    },
    languageBreakdown: [],
    repositoryPurpose: {
      purpose: 'Software Project',
      reason: 'Empty codebase or layout structure.',
      confidence: 50
    },
    repositoryFingerprint: {
      packageManager: 'unknown',
      primaryType: 'Unknown',
      workspaceCount: 0,
      languages: [],
      repositoryVersion: '0.1.0',
      versionSource: 'unknown'
    },
    complexityScore: 0,
    analysisWarnings: [],
    analysisConfidence: 0, // Computed dynamically as 0 under penalty rules
    intelligenceSchemaVersion: '2.0',
    generatedAt: new Date().toISOString(),
    analyzerVersion: PRODUCT_VERSION,
    overviewMarkdown: '# Repository Overview\n\nNo source files detected in this workspace.'
  };
}

/**
 * Scan paths excluding infra directories.
 */
export function scanDirectoriesAndPaths(files: RepositoryFile[]) {
  const directorySet = new Set<string>();
  const coreDirs = new Set<string>();
  const monorepoPackages = new Set<string>();

  files.forEach((file) => {
    const segments = file.path.split('/');
    let currentPath = '';

    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (DIRECTORY_EXCLUSIONS.has(seg)) {
        break; // Ignore infra directories
      }
      currentPath = currentPath ? `${currentPath}/${seg}` : seg;
      directorySet.add(currentPath);

      if (i === 0) {
        coreDirs.add(seg);
      }
    }

    if (file.path.endsWith('package.json')) {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        parts.pop();
        const packageFolder = parts.join('/');
        const hasExclusion = parts.some(p => DIRECTORY_EXCLUSIONS.has(p));
        if (!hasExclusion) {
          monorepoPackages.add(packageFolder);
        }
      }
    }
  });

  return {
    totalDirectories: directorySet.size,
    coreDirectories: Array.from(coreDirs).filter(d => !DIRECTORY_EXCLUSIONS.has(d)).sort(),
    packageFolders: Array.from(monorepoPackages).sort()
  };
}

export * from './ai-context-generator';
export * from './prompt-presets';

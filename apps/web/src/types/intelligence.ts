export type ProjectType = 
  | 'Next.js' 
  | 'React' 
  | 'Node.js' 
  | 'Monorepo' 
  | 'Python' 
  | 'Go' 
  | 'Rust' 
  | 'Static HTML' 
  | 'Unknown';

export type PackageManagerType = 
  | 'npm'
  | 'pnpm'
  | 'yarn'
  | 'bun'
  | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface TechnologyDetection {
  type: ProjectType;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  evidence: string[];
}

export interface FrameworkDetection {
  name: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

export interface LanguageBreakdownEntry {
  language: string;
  files: number;
  bytes: number;
  percentage: number;
}

export interface DependencyEntry {
  name: string;
  version: string;
}

export interface RepositoryStats {
  totalFiles: number;
  totalDirectories: number;
  totalBytes: number;
}

export interface RepositoryPurpose {
  purpose: string;
  reason: string;
  confidence: number;
}

export type EntryPointType =
  | 'Page'
  | 'API Route'
  | 'Middleware'
  | 'CLI Binary'
  | 'Executable Entry'
  | 'Library Entry'
  | 'Static HTML';

export interface EntryPointEntry {
  path: string;
  type: EntryPointType;
  priority: number;
}

export interface RepositoryFingerprint {
  packageManager: PackageManagerType;
  primaryType: ProjectType;
  workspaceCount: number;
  languages: string[];
  repositoryVersion: string;
  versionSource: 'package.json' | 'Cargo.toml' | 'pyproject.toml' | 'unknown';
}

export interface RepositoryIntelligence {
  primaryType: ProjectType;
  detectedTechnologies: TechnologyDetection[];
  frameworks: FrameworkDetection[];
  packageManager: PackageManagerType;
  workspaceCount: number;
  entryPoints: EntryPointEntry[];
  coreDirectories: string[];
  packageFolders: string[];
  productionDependencies: DependencyEntry[];
  developmentDependencies: DependencyEntry[];
  repositoryStats: RepositoryStats;
  languageBreakdown: LanguageBreakdownEntry[];
  repositoryPurpose: RepositoryPurpose;
  repositoryFingerprint: RepositoryFingerprint;
  complexityScore: number;
  analysisWarnings: string[];
  analysisConfidence: number;
  intelligenceSchemaVersion: '2.0';
  generatedAt: string;
  analyzerVersion: string;
  overviewMarkdown: string;
}

export type AIContextPreset =
  | 'bug-fix'
  | 'feature-dev'
  | 'refactor'
  | 'code-review'
  | 'arch-review'
  | 'perf-opt'
  | 'security-review';

export type AIContextLengthMode = 'compact' | 'standard' | 'detailed';

export type AIContextExportFormat = 'markdown' | 'text' | 'json';

export type AITarget =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'cursor'
  | 'windsurf'
  | 'copilot';

export interface AIContextMetrics {
  promptQuality: number;     // Estimated value (0 to 100)
  completeness: number;      // Estimated completeness percentage (0 to 100)
  promptReadiness: number;   // Calculated prompt readiness score (0 to 100)
  estimatedTokens: number;   // Heuristic calculation (content.length / 4)
  wordCount: number;         // Count of words in output
  compressionRatio: number;  // Ratio of repository bytes divided by context bytes
}

export interface AIContextPayload {
  content: string;
  prompt: string;            // Target-aware prompt instructions
  metrics: AIContextMetrics;
  preset: AIContextPreset;
  lengthMode: AIContextLengthMode;
  target: AITarget;
  format: AIContextExportFormat;
  contextSchemaVersion: '1.0';
}

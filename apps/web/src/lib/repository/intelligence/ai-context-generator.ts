import type { 
  RepositoryIntelligence,
  AIContextPreset,
  AIContextLengthMode,
  AIContextExportFormat,
  AITarget,
  AIContextPayload,
  AIContextMetrics
} from '../../../types/intelligence';
import { getPromptTemplate } from './prompt-presets';

// Caching layer keys
interface CacheKey {
  preset: AIContextPreset;
  lengthMode: AIContextLengthMode;
  target: AITarget;
  format: AIContextExportFormat;
  generatedAt: string;
}

interface ContextDependency {
  name: string;
  version: string;
}

interface ContextEntryPoint {
  path: string;
  type: string;
  priority: number;
}

interface ContextLanguage {
  language: string;
  percentage: number;
}

interface ContextData {
  projectName: string;
  primaryType: string;
  frameworks: string[];
  packageManager: string;
  workspaceCount: number;
  purpose: string;
  purposeReason: string;
  complexityScore: number;
  entryPoints: ContextEntryPoint[];
  coreDirectories: string[];
  productionDependencies: ContextDependency[];
  developmentDependencies: ContextDependency[];
  stats: {
    totalFiles: number;
    totalDirectories: number;
    totalBytes: number;
  };
  warnings: string[];
  languages: ContextLanguage[];
}

let lastCacheKey: CacheKey | null = null;
let lastPayload: AIContextPayload | null = null;

/**
 * Main generator for AI repository context payload.
 */
export function generateAIContext(
  intelligence: RepositoryIntelligence,
  preset: AIContextPreset,
  lengthMode: AIContextLengthMode,
  target: AITarget,
  format: AIContextExportFormat
): AIContextPayload {
  // Caching check
  if (
    lastCacheKey &&
    lastPayload &&
    lastCacheKey.preset === preset &&
    lastCacheKey.lengthMode === lengthMode &&
    lastCacheKey.target === target &&
    lastCacheKey.format === format &&
    lastCacheKey.generatedAt === intelligence.generatedAt
  ) {
    return lastPayload;
  }

  // 1. Generate Prompt Instructions
  const prompt = getPromptTemplate(preset, target);

  // 2. Generate Content Package
  const content = buildContent(intelligence, preset, lengthMode, target, format);

  // 3. Estimate Metrics
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  
  // Character count token estimate replacement: Math.round(content.length / 4)
  const estimatedTokens = Math.round(content.length / 4);

  // Completeness score
  const completeness = lengthMode === 'compact' ? 60 : lengthMode === 'standard' ? 85 : 100;

  // Prompt quality estimate
  let promptQuality = 80;
  if (lengthMode === 'detailed') promptQuality += 10;
  if (lengthMode === 'compact') promptQuality -= 10;
  if (intelligence.analysisWarnings.length > 0) promptQuality -= 5;
  promptQuality = Math.min(100, Math.max(0, promptQuality));

  // Prompt readiness: promptQuality * 0.4 + completeness * 0.4 + analysisConfidence * 0.2
  const promptReadiness = Math.round(
    promptQuality * 0.4 +
    completeness * 0.4 +
    intelligence.analysisConfidence * 0.2
  );

  // Compression ratio: repository bytes divided by context bytes
  const contextBytes = new TextEncoder().encode(content).length;
  const compressionRatio = Math.round(intelligence.repositoryStats.totalBytes / Math.max(1, contextBytes));

  const metrics: AIContextMetrics = {
    promptQuality,
    completeness,
    promptReadiness,
    estimatedTokens,
    wordCount,
    compressionRatio
  };

  const payload: AIContextPayload = {
    content,
    prompt,
    metrics,
    preset,
    lengthMode,
    target,
    format,
    contextSchemaVersion: '1.0'
  };

  // Cache update
  lastCacheKey = {
    preset,
    lengthMode,
    target,
    format,
    generatedAt: intelligence.generatedAt
  };
  lastPayload = payload;

  return payload;
}

/**
 * Clear caching layer (primarily useful for tests)
 */
export function clearContextCache() {
  lastCacheKey = null;
  lastPayload = null;
}

function buildContent(
  intelligence: RepositoryIntelligence,
  preset: AIContextPreset,
  lengthMode: AIContextLengthMode,
  target: AITarget,
  format: AIContextExportFormat
): string {
  const stats = intelligence.repositoryStats;
  
  // Dependency filters & length mode restrictions
  let prodDeps = intelligence.productionDependencies;
  let devDeps = intelligence.developmentDependencies;

  if (lengthMode === 'compact') {
    prodDeps = prodDeps.slice(0, 5);
    devDeps = [];
  } else if (lengthMode === 'standard') {
    prodDeps = prodDeps.slice(0, 15);
    devDeps = devDeps.slice(0, 8);
  } else if (lengthMode === 'detailed') {
    prodDeps = prodDeps.slice(0, 25); // Limit production dependencies to top 25
    devDeps = devDeps.slice(0, 15);   // Limit development dependencies to top 15
  }

  // Extract project name from markdown title if possible
  const titleMatch = intelligence.overviewMarkdown.match(/# Repository Overview - ([^\n]+)/);
  const projectName = titleMatch ? titleMatch[1].trim() : 'Project';

  const data = {
    projectName,
    primaryType: intelligence.primaryType,
    frameworks: intelligence.frameworks.map(f => f.name),
    packageManager: intelligence.packageManager,
    workspaceCount: intelligence.workspaceCount,
    purpose: intelligence.repositoryPurpose.purpose,
    purposeReason: intelligence.repositoryPurpose.reason,
    complexityScore: intelligence.complexityScore,
    entryPoints: intelligence.entryPoints,
    coreDirectories: intelligence.coreDirectories,
    productionDependencies: prodDeps,
    developmentDependencies: devDeps,
    stats: {
      totalFiles: stats.totalFiles,
      totalDirectories: stats.totalDirectories,
      totalBytes: stats.totalBytes
    },
    warnings: intelligence.analysisWarnings,
    languages: intelligence.languageBreakdown.map(l => ({ language: l.language, percentage: l.percentage }))
  };

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'text') {
    return serializeText(data, lengthMode);
  }

  // Default to markdown
  return serializeMarkdown(data, lengthMode);
}

function serializeMarkdown(data: ContextData, lengthMode: AIContextLengthMode): string {
  const parts: string[] = [];
  parts.push(`# Repository Context: ${data.projectName}`);
  parts.push(`* **Stack Category**: ${data.primaryType}`);
  parts.push(`* **Target Purpose**: ${data.purpose}`);
  parts.push(`* **Complexity Index**: ${data.complexityScore}/100`);
  parts.push(`* **Package Manager**: ${data.packageManager}`);
  
  if (data.workspaceCount > 0) {
    parts.push(`* **Workspace Projects**: ${data.workspaceCount}`);
  }

  parts.push('');
  parts.push('## Entry Points');
  if (data.entryPoints.length === 0) {
    parts.push('*No entry points detected.*');
  } else {
    data.entryPoints.forEach((ep: ContextEntryPoint, idx: number) => {
      parts.push(`${idx + 1}. \`${ep.path}\` (${ep.type} - Priority ${ep.priority})`);
    });
  }

  parts.push('');
  parts.push('## Core Directories');
  if (data.coreDirectories.length === 0) {
    parts.push('*No core directories.*');
  } else {
    data.coreDirectories.forEach((dir: string) => {
      parts.push(`* \`${dir}/\``);
    });
  }

  if (lengthMode !== 'compact') {
    parts.push('');
    parts.push('## Frameworks');
    if (data.frameworks.length === 0) {
      parts.push('*No frameworks detected.*');
    } else {
      data.frameworks.forEach((fw: string) => {
        parts.push(`* ${fw}`);
      });
    }

    parts.push('');
    parts.push('## Language Breakdown');
    if (data.languages.length === 0) {
      parts.push('*No language data available.*');
    } else {
      data.languages.forEach((lang: ContextLanguage) => {
        parts.push(`* **${lang.language}**: ${lang.percentage}%`);
      });
    }

    if (data.warnings.length > 0) {
      parts.push('');
      parts.push('## System Diagnostics Warnings');
      data.warnings.forEach((warn: string) => {
        parts.push(`* ⚠️ ${warn}`);
      });
    }
  }

  parts.push('');
  parts.push('## Production Dependencies');
  if (data.productionDependencies.length === 0) {
    parts.push('*No dependencies.*');
  } else {
    data.productionDependencies.forEach((dep: ContextDependency) => {
      parts.push(`* \`${dep.name}\`: ${dep.version}`);
    });
  }

  if (lengthMode === 'detailed' && data.developmentDependencies.length > 0) {
    parts.push('');
    parts.push('## Development Dependencies');
    data.developmentDependencies.forEach((dep: ContextDependency) => {
      parts.push(`* \`${dep.name}\`: ${dep.version}`);
    });
  }

  if (lengthMode === 'detailed') {
    parts.push('');
    parts.push('## Filesystem Statistics');
    parts.push(`* **Total Files**: ${data.stats.totalFiles}`);
    parts.push(`* **Total Directories**: ${data.stats.totalDirectories}`);
    parts.push(`* **Total Size**: ${(data.stats.totalBytes / 1024).toFixed(1)} KB`);
    parts.push(`* **Purpose Reason**: ${data.purposeReason}`);
  }

  return parts.join('\n');
}

function serializeText(data: ContextData, lengthMode: AIContextLengthMode): string {
  const parts: string[] = [];
  parts.push(`REPOSITORY CONTEXT SUMMARY: ${data.projectName}`);
  parts.push('========================================');
  parts.push(`Primary Stack Category: ${data.primaryType}`);
  parts.push(`Target Purpose: ${data.purpose}`);
  parts.push(`Complexity Score: ${data.complexityScore}/100`);
  parts.push(`Package Manager: ${data.packageManager}`);
  
  if (data.workspaceCount > 0) {
    parts.push(`Workspaces count: ${data.workspaceCount}`);
  }

  parts.push('');
  parts.push('ENTRY POINTS:');
  if (data.entryPoints.length === 0) {
    parts.push('- None detected');
  } else {
    data.entryPoints.forEach((ep: ContextEntryPoint) => {
      parts.push(`- ${ep.path} [${ep.type}]`);
    });
  }

  parts.push('');
  parts.push('CORE DIRECTORIES:');
  if (data.coreDirectories.length === 0) {
    parts.push('- None');
  } else {
    data.coreDirectories.forEach((dir: string) => {
      parts.push(`- ${dir}/`);
    });
  }

  if (lengthMode !== 'compact') {
    parts.push('');
    parts.push('FRAMEWORKS:');
    parts.push(data.frameworks.length > 0 ? data.frameworks.join(', ') : 'None');

    parts.push('');
    parts.push('LANGUAGES:');
    if (data.languages.length === 0) {
      parts.push('- None');
    } else {
      data.languages.forEach((lang: ContextLanguage) => {
        parts.push(`- ${lang.language}: ${lang.percentage}%`);
      });
    }

    if (data.warnings.length > 0) {
      parts.push('');
      parts.push('DIAGNOSTICS WARNINGS:');
      data.warnings.forEach((warn: string) => {
        parts.push(`! ${warn}`);
      });
    }
  }

  parts.push('');
  parts.push('PRODUCTION DEPENDENCIES:');
  if (data.productionDependencies.length === 0) {
    parts.push('- None');
  } else {
    data.productionDependencies.forEach((dep: ContextDependency) => {
      parts.push(`- ${dep.name} (${dep.version})`);
    });
  }

  if (lengthMode === 'detailed' && data.developmentDependencies.length > 0) {
    parts.push('');
    parts.push('DEVELOPMENT DEPENDENCIES:');
    data.developmentDependencies.forEach((dep: ContextDependency) => {
      parts.push(`- ${dep.name} (${dep.version})`);
    });
  }

  return parts.join('\n');
}

import type { 
  TechnologyDetection,
  FrameworkDetection,
  EntryPointEntry,
  DependencyEntry,
  LanguageBreakdownEntry,
  RepositoryPurpose,
  PackageManagerType,
  ProjectType
} from '../../../types/intelligence';

export function generateAIOverview(
  repoName: string,
  primaryType: ProjectType,
  detections: TechnologyDetection[],
  frameworks: FrameworkDetection[],
  packageManager: PackageManagerType,
  entryPoints: EntryPointEntry[],
  coreDirectories: string[],
  packageFolders: string[],
  prodDeps: DependencyEntry[],
  devDeps: DependencyEntry[],
  languages: LanguageBreakdownEntry[],
  purpose: RepositoryPurpose,
  complexity: number,
  filesCount: number,
  dirsCount: number,
  bytesCount: number,
  healthScore: number,
  warnings: string[]
): string {
  const displayBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };

  let md = `# Repository Overview - ${repoName}\n\n`;

  if (warnings.length > 0) {
    md += `> [!WARNING]\n`;
    md += `> **Analysis Warnings Detected**:\n`;
    warnings.forEach((warn) => {
      md += `> * ${warn}\n`;
    });
    md += `\n`;
  }

  md += `## Repository Type\n* **Primary Stack**: ${primaryType}\n* **Heuristic Purpose**: ${purpose.purpose}\n* **Purpose Confidence**: ${purpose.confidence}%\n* **Reason**: ${purpose.reason}\n\n`;

  md += `## Technologies\n`;
  if (detections.length > 0) {
    detections.forEach((d) => {
      md += `* ${d.type} (Confidence: ${d.confidence}% - ${d.confidenceLevel} level)\n`;
      if (d.evidence.length > 0) {
        d.evidence.forEach(ev => {
          md += `  * Evidence: ${ev}\n`;
        });
      }
    });
  } else {
    md += `* None detected\n`;
  }
  md += `\n`;

  md += `## Frameworks\n`;
  if (frameworks.length > 0) {
    frameworks.forEach((f) => {
      md += `* ${f.name} (Confidence: ${f.confidence}% - ${f.confidenceLevel} level)\n`;
    });
  } else {
    md += `* None detected\n`;
  }
  md += `\n`;

  md += `## Package Manager\n* **Detected**: ${packageManager}\n\n`;

  md += `## Entry Points\n`;
  if (entryPoints.length > 0) {
    entryPoints.forEach((e) => {
      md += `* \`${e.path}\` (${e.type} - priority ${e.priority})\n`;
    });
  } else {
    md += `* Unknown / None detected\n`;
  }
  md += `\n`;

  md += `## Directory Structure\n`;
  md += `* **Total Files**: ${filesCount}\n`;
  md += `* **Directories**: ${dirsCount}\n`;
  md += `* **Total Size**: ${displayBytes(bytesCount)}\n`;
  md += `* **Health Score**: ${healthScore}/100\n`;
  md += `* **Complexity Index**: ${complexity}/100\n\n`;

  md += `### Core Directories\n`;
  if (coreDirectories.length > 0) {
    coreDirectories.forEach((d) => {
      md += `* \`${d}/\`\n`;
    });
  } else {
    md += `* None (Flat layout)\n`;
  }
  md += `\n`;

  if (packageFolders.length > 0) {
    md += `### Detected Monorepo Packages\n`;
    packageFolders.forEach((d) => {
      md += `* \`${d}/\`\n`;
    });
    md += `\n`;
  }

  md += `## Key Runtime Dependencies\n`;
  if (prodDeps.length > 0) {
    prodDeps.forEach((d) => {
      md += `* \`${d.name}\` (${d.version})\n`;
    });
  } else {
    md += `* None parsed\n`;
  }
  md += `\n`;

  md += `## Key Development Dependencies\n`;
  if (devDeps.length > 0) {
    devDeps.forEach((d) => {
      md += `* \`${d.name}\` (${d.version})\n`;
    });
  } else {
    md += `* None parsed\n`;
  }
  md += `\n`;

  md += `## Language Breakdown\n`;
  if (languages.length > 0) {
    languages.forEach((l) => {
      md += `* **${l.language}**: ${l.files} files (${displayBytes(l.bytes)}) - ${l.percentage}%\n`;
    });
  } else {
    md += `* Unknown\n`;
  }
  md += `\n`;

  md += `## Recommended AI Context\n`;
  md += `When providing prompt context to LLMs (such as ChatGPT, Claude, Gemini, Cursor, or Copilot) for modifications in this codebase, reference the primary technology stack **${primaryType}** and entry points. Use the following prompt guidelines:\n`;
  md += `\`\`\`text\n`;
  md += `Context: This is a ${primaryType} project behaving as a ${purpose.purpose}.\n`;
  if (entryPoints.length > 0) {
    md += `Main Entrypoint: ${entryPoints[0].path}\n`;
  }
  md += `Please keep styles in line with existing patterns inside the core directories listed above.\n`;
  md += `\`\`\`\n`;

  return md;
}

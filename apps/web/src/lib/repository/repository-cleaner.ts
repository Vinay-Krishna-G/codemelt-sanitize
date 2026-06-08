import { cleanContent } from 'codemelt-sanitize-core/dist/cleaner.js';
import { scanContent } from 'codemelt-sanitize-core/dist/scanner.js';
import type { CleanConfig } from 'codemelt-sanitize-shared';
import type { RepositoryFile } from '../../types/sanitize';

export function cleanRepositoryFile(
  file: RepositoryFile,
  config: CleanConfig
): RepositoryFile {
  const cleaned = cleanContent(file.content, file.path, config);
  const cleanedIssues = scanContent(cleaned, file.path, config);

  return {
    ...file,
    cleanedContent: cleaned,
    cleanedBytes: new TextEncoder().encode(cleaned).length,
    issues: cleanedIssues,
    issueCount: cleanedIssues.length
  };
}

export interface RecalculatedMetrics {
  totalIssues: number;
  totalBytesSaved: number;
  totalComments: number;
  totalTodos: number;
  totalFixmes: number;
  totalConsoleLogs: number;
}

export function recalculateRepositoryMetrics(
  files: RepositoryFile[]
): RecalculatedMetrics {
  let totalIssues = 0;
  let totalComments = 0;
  let totalTodos = 0;
  let totalFixmes = 0;
  let totalConsoleLogs = 0;
  let totalBytesSaved = 0;

  files.forEach((file) => {
    file.issues.forEach((issue) => {
      if (issue.type === 'comment') totalComments++;
      else if (issue.type === 'todo') totalTodos++;
      else if (issue.type === 'fixme') totalFixmes++;
      else if (issue.type === 'console_log') totalConsoleLogs++;
    });
    totalIssues += file.issueCount;
    if (file.cleanedBytes !== undefined) {
      totalBytesSaved += Math.max(0, file.originalBytes - file.cleanedBytes);
    }
  });

  return {
    totalIssues,
    totalBytesSaved,
    totalComments,
    totalTodos,
    totalFixmes,
    totalConsoleLogs
  };
}

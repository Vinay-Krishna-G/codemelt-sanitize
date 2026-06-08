import type { RepositoryAnalysis } from '../../types/sanitize';

export function generateAnalysisMetrics(
  repoName: string,
  repoAnalysis: RepositoryAnalysis
): string {
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  repoAnalysis.files.forEach((file) => {
    file.issues.forEach((issue) => {
      if (issue.type === 'fixme') {
        criticalCount++;
      } else if (issue.type === 'todo' || issue.type === 'console_log') {
        warningCount++;
      } else if (issue.type === 'comment') {
        infoCount++;
      }
    });
  });

  const analysisJsonObj = {
    repositoryName: repoName,
    exportedAt: new Date().toISOString(),
    summary: {
      totalFiles: repoAnalysis.totalFiles,
      totalIssues: repoAnalysis.totalIssues,
      severityCounts: {
        critical: criticalCount,
        warning: warningCount,
        informational: infoCount
      }
    },
    files: repoAnalysis.files.map((file) => ({
      path: file.path,
      issuesCount: file.issueCount,
      issues: file.issues.map((issue) => ({
        line: issue.line,
        type: issue.type,
        message: issue.message,
        contentPreview: issue.rawContent.trim().substring(0, 100)
      }))
    }))
  };

  return JSON.stringify(analysisJsonObj, null, 2);
}

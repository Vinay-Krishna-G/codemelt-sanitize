import type { RepositoryAnalysis } from '../../types/sanitize';
import { calculateHealthScore } from './health-score';

export function generateReport(
  repoName: string,
  repoAnalysis: RepositoryAnalysis
): { json: string; markdown: string } {
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let cleanedFilesCount = 0;

  repoAnalysis.files.forEach((file) => {
    if (file.cleanedContent !== undefined) {
      cleanedFilesCount++;
    }
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

  const healthScore = calculateHealthScore(
    repoAnalysis.totalFiles,
    criticalCount,
    warningCount,
    infoCount
  );

  const displayBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // 1. JSON Report
  const reportJsonObj = {
    repositoryName: repoName,
    generatedAt: new Date().toISOString(),
    healthScore,
    summary: {
      totalFiles: repoAnalysis.totalFiles,
      cleanedFiles: cleanedFilesCount,
      totalIssuesRemaining: repoAnalysis.totalIssues,
      bytesSaved: repoAnalysis.totalBytesSaved,
      severityRemaining: {
        critical: criticalCount,
        warning: warningCount,
        informational: infoCount
      }
    },
    files: repoAnalysis.files.map((file) => ({
      path: file.path,
      originalBytes: file.originalBytes,
      cleanedBytes: file.cleanedBytes || file.originalBytes,
      bytesSaved: file.cleanedBytes !== undefined ? Math.max(0, file.originalBytes - file.cleanedBytes) : 0,
      issuesCount: file.issueCount,
      status: file.cleanedContent !== undefined ? 'cleaned' : 'original'
    }))
  };

  // 2. Markdown Report
  let markdownContent = `# CodeMelt Sanitize - Repository Clean Report\n\n`;
  markdownContent += `**Repository Name:** ${repoName}\n`;
  markdownContent += `**Generated At:** ${new Date().toLocaleString()}\n`;
  markdownContent += `**Workspace Health Score:** ${healthScore} / 100\n\n`;
  
  markdownContent += `## Summary Metrics\n`;
  markdownContent += `| Metric | Value |\n`;
  markdownContent += `| :--- | :--- |\n`;
  markdownContent += `| Total Files Scanned | ${repoAnalysis.totalFiles} |\n`;
  markdownContent += `| Total Files Cleaned | ${cleanedFilesCount} |\n`;
  markdownContent += `| Total Remaining Issues | ${repoAnalysis.totalIssues} |\n`;
  markdownContent += `| Total Bytes Saved | ${displayBytes(repoAnalysis.totalBytesSaved)} |\n\n`;

  markdownContent += `## Remaining Issues Severity Breakdown\n`;
  markdownContent += `| Severity | Count |\n`;
  markdownContent += `| :--- | :--- |\n`;
  markdownContent += `| **Critical** | ${criticalCount} |\n`;
  markdownContent += `| **Warning** | ${warningCount} |\n`;
  markdownContent += `| **Informational** | ${infoCount} |\n\n`;

  markdownContent += `## Detailed File Status List\n`;
  markdownContent += `| File Path | Original Size | Cleaned Size | Bytes Saved | Remaining Issues | Status |\n`;
  markdownContent += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  repoAnalysis.files.forEach((file) => {
    const originalSize = displayBytes(file.originalBytes);
    const cleanedSize = file.cleanedBytes !== undefined ? displayBytes(file.cleanedBytes) : originalSize;
    const saved = file.cleanedBytes !== undefined ? displayBytes(Math.max(0, file.originalBytes - file.cleanedBytes)) : '0 B';
    const status = file.cleanedContent !== undefined ? '✅ Cleaned' : 'Original';
    markdownContent += `| \`${file.path}\` | ${originalSize} | ${cleanedSize} | ${saved} | ${file.issueCount} | ${status} |\n`;
  });

  return {
    json: JSON.stringify(reportJsonObj, null, 2),
    markdown: markdownContent
  };
}

import { ScanResult, CleanResult, NoiseType } from 'codemelt-sanitize-shared';

function isCleanResult(result: ScanResult | CleanResult): result is CleanResult {
  return 'cleanedFiles' in result.summary;
}

export function generateMarkdownReport(result: ScanResult | CleanResult): string {
  const { summary, files } = result;
  
  let markdown = `# CodeMelt Sanitize - Cleanup Report\n\n`;
  
  // Stats summary section
  markdown += `## Execution Summary\n\n`;
  markdown += `* **Total Files Found:** ${summary.totalFiles}\n`;
  markdown += `* **Scanned Files:** ${summary.scannedFiles}\n`;
  markdown += `* **Total Issues Detected:** ${summary.totalIssues}\n`;
  
  if (isCleanResult(result)) {
    markdown += `* **Files Cleaned:** ${result.summary.cleanedFiles}\n`;
    markdown += `* **Bytes Saved:** ${result.summary.bytesSaved} bytes\n`;
  }
  
  markdown += `* **Duration:** ${summary.durationMs.toFixed(2)} ms\n\n`;
  
  // Breakdown of issue types
  markdown += `### Issues by Category\n\n`;
  markdown += `| Issue Type | Count |\n`;
  markdown += `| :--- | :--- |\n`;
  
  const categories: { type: NoiseType; label: string }[] = [
    { type: 'comment', label: 'Comments' },
    { type: 'todo', label: 'TODOs' },
    { type: 'fixme', label: 'FIXMEs' },
    { type: 'console_log', label: 'Console Logs' }
  ];
  
  for (const cat of categories) {
    const count = summary.issuesByType[cat.type] || 0;
    markdown += `| ${cat.label} | ${count} |\n`;
  }
  markdown += `\n`;
  
  // Detailed file analysis
  markdown += `## File Details\n\n`;
  
  const filesWithIssues = files.filter(f => f.issues.length > 0);
  
  if (filesWithIssues.length === 0) {
    markdown += `*No development noise issues detected in the scanned files. Your codebase is clean!*\n`;
    return markdown;
  }
  
  for (const file of filesWithIssues) {
    const status = file.isCleaned ? '✅ Cleaned' : '⚠️ Pending';
    markdown += `### ${file.filePath} (${status})\n\n`;
    markdown += `| Line | Type | Message | Snippet |\n`;
    markdown += `| :--- | :--- | :--- | :--- |\n`;
    
    for (const issue of file.issues) {
      const cleanContent = issue.rawContent.trim().replace(/\n/g, ' ').substring(0, 80);
      markdown += `| ${issue.line} | \`${issue.type}\` | ${issue.message} | \`${cleanContent}\` |\n`;
    }
    markdown += `\n`;
  }
  
  return markdown;
}

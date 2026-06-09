import { zipSync, strToU8 } from 'fflate';
import type { RepositoryAnalysis } from '../../types/sanitize';
import { generateReport } from './report-generator';
import { calculateHealthScore } from './health-score';
import { PRODUCT_NAME, PRODUCT_VERSION } from '../branding';

/**
 * Prepares reports, metadata, and all code files (cleaned versions preferred)
 * and packs them into a compressed ZIP archive returned as raw binary bytes.
 */
export function exportRepositoryZip(
  repoName: string,
  repoAnalysis: RepositoryAnalysis
): Uint8Array {
  // 1. Calculate counts for health score
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

  const healthScore = calculateHealthScore(
    repoAnalysis.totalFiles,
    criticalCount,
    warningCount,
    infoCount
  );

  // 2. Generate report JSON and Markdown files
  const { json: reportJson, markdown: reportMd } = generateReport(repoName, repoAnalysis);

  // 3. Prepare export metadata
  const metadata = {
    version: PRODUCT_VERSION,
    generatedAt: new Date().toISOString(),
    toolName: PRODUCT_NAME,
    healthScore
  };

  const metadataJson = JSON.stringify(metadata, null, 2);

  // 4. Construct ZIP dictionary with flat paths
  const zipData: Record<string, Uint8Array> = {};
  
  zipData['report.json'] = strToU8(reportJson);
  zipData['report.md'] = strToU8(reportMd);
  zipData['export-metadata.json'] = strToU8(metadataJson);

  repoAnalysis.files.forEach((file) => {
    // Include cleaned files when available, original files otherwise
    const content = file.cleanedContent !== undefined ? file.cleanedContent : file.content;
    zipData[file.path] = strToU8(content);
  });

  // 5. Generate and return ZIP archive bytes
  return zipSync(zipData);
}

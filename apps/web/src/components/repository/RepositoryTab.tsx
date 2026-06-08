'use client';

import React, { useState } from 'react';
import { scanContent } from 'codemelt-sanitize-core/dist/scanner.js';
import { cleanContent } from 'codemelt-sanitize-core/dist/cleaner.js';
import { SUPPORTED_EXTENSIONS } from 'codemelt-sanitize-shared';
import type { RepositoryAnalysis, RepositoryFile } from '../../types/sanitize';
import { DEFAULT_ANALYZE_CONFIG } from '../../lib/default-config';
import { calculateHealthScore } from '../../lib/repository/health-score';

// Import subcomponents
import RepositoryUploader from './RepositoryUploader';
import RepositoryHeader from './RepositoryHeader';
import RepositoryExplorer from './RepositoryExplorer';
import RepositoryDetails from './RepositoryDetails';
import RepositoryDiagnostics from './RepositoryDiagnostics';

// Limits
const MAX_FILES = 1000;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 500 * 1024; // 500KB

export default function RepositoryTab() {
  const [skippedFiles, setSkippedFiles] = useState<{ path: string; reason: string }[]>([]);
  const [repoAnalysis, setRepoAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoProgress, setRepoProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skippedStats, setSkippedStats] = useState<{
    directories: number;
    extensions: number;
    oversized: number;
  } | null>(null);

  const processFiles = async (fileList: File[]) => {
    setRepoLoading(true);
    setError(null);
    setSkippedStats(null);
    setRepoProgress({ current: 0, total: fileList.length });

    const candidateFilesList: File[] = [];
    let skippedDirectories = 0;
    let skippedExtensions = 0;
    let skippedOversized = 0;
    const skippedArr: { path: string; reason: string }[] = [];

    // 1. Group, filter, and validate file types
    for (const file of fileList) {
      const relPath = file.webkitRelativePath || file.name;
      const normalizedPath = relPath.replace(/\\/g, '/');
      const pathSegments = normalizedPath.toLowerCase().split('/');

      // Check directory exclusions
      const isExcluded = pathSegments.some((segment) =>
        ['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage'].includes(segment)
      );

      if (isExcluded) {
        skippedDirectories++;
        continue;
      }

      // Check supported file extensions
      const dotIndex = file.name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? file.name.substring(dotIndex).toLowerCase() : '';
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        skippedExtensions++;
        skippedArr.push({ path: normalizedPath, reason: 'Unsupported extension' });
        continue;
      }

      // Check individual file size limit
      if (file.size > MAX_FILE_SIZE) {
        skippedOversized++;
        skippedArr.push({ path: normalizedPath, reason: 'Oversized file (>500KB)' });
        continue;
      }

      candidateFilesList.push(file);
    }

    // Handle empty repository diagnostics panel
    if (candidateFilesList.length === 0) {
      setSkippedStats({
        directories: skippedDirectories,
        extensions: skippedExtensions,
        oversized: skippedOversized
      });
      setSkippedFiles(skippedArr);
      setRepoLoading(false);
      setRepoProgress(null);
      return;
    }

    // 2. Validate safety limits on candidate files
    if (candidateFilesList.length > MAX_FILES) {
      setError(`Repository contains too many source files (maximum limit is ${MAX_FILES} candidate files).`);
      setRepoLoading(false);
      setRepoProgress(null);
      return;
    }

    let totalSizeBytes = 0;
    for (const f of candidateFilesList) {
      totalSizeBytes += f.size;
    }
    if (totalSizeBytes > MAX_TOTAL_SIZE) {
      setError(`Total repository candidate size exceeds the maximum limit of 10MB.`);
      setRepoLoading(false);
      setRepoProgress(null);
      return;
    }

    // 3. Scan candidate files
    const analyzedFiles: RepositoryFile[] = [];
    let totalIssues = 0;
    let totalComments = 0;
    let totalTodos = 0;
    let totalFixmes = 0;
    let totalConsoleLogs = 0;

    let processedCount = 0;

    for (const file of candidateFilesList) {
      const relPath = file.webkitRelativePath || file.name;
      const normalizedPath = relPath.replace(/\\/g, '/');

      try {
        const content = await file.text();
        const issues = scanContent(content, normalizedPath, DEFAULT_ANALYZE_CONFIG);
        const originalBytes = new TextEncoder().encode(content).length;

        const countByType = (type: string) => issues.filter((i) => i.type === type).length;
        totalComments += countByType('comment');
        totalTodos += countByType('todo');
        totalFixmes += countByType('fixme');
        totalConsoleLogs += countByType('console_log');
        totalIssues += issues.length;

        analyzedFiles.push({
          path: normalizedPath,
          content,
          issues,
          issueCount: issues.length,
          originalBytes
        });
      } catch {
        // Skip unreadable files
      }

      processedCount++;
      setRepoProgress({ current: processedCount, total: candidateFilesList.length });
    }

    setSkippedFiles(skippedArr);
    setRepoAnalysis({
      files: analyzedFiles,
      totalFiles: analyzedFiles.length,
      totalIssues,
      totalBytes: totalSizeBytes,
      totalBytesSaved: 0,
      totalComments,
      totalTodos,
      totalFixmes,
      totalConsoleLogs
    });

    if (analyzedFiles.length > 0) {
      setSelectedFilePath(analyzedFiles[0].path);
    }

    setRepoLoading(false);
    setRepoProgress(null);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      filesArray.push(fileList[i]);
    }

    await processFiles(filesArray);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setRepoLoading(true);
    setRepoAnalysis(null);
    setSkippedStats(null);
    setSelectedFilePath(null);
    setError(null);

    const filesToProcess: File[] = [];

    const traverseEntry = async (entry: FileSystemEntry, path = '') => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject));
        Object.defineProperty(file, 'webkitRelativePath', {
          value: path ? `${path}/${file.name}` : file.name,
          writable: true
        });
        filesToProcess.push(file);
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const nameLower = dirEntry.name.toLowerCase();
        if (['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage'].includes(nameLower)) {
          return; // Skip traversing completely!
        }
        const dirReader = dirEntry.createReader();
        const readEntries = async () => {
          return new Promise<FileSystemEntry[]>((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
        };

        let entries = await readEntries();
        while (entries.length > 0) {
          for (const childEntry of entries) {
            await traverseEntry(childEntry, path ? `${path}/${entry.name}` : entry.name);
          }
          entries = await readEntries();
        }
      }
    };

    try {
      const traversalPromises = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            traversalPromises.push(traverseEntry(entry));
          }
        }
      }

      await Promise.all(traversalPromises);
      await processFiles(filesToProcess);
    } catch {
      setError('Failed to extract files from directory drop');
      setRepoLoading(false);
    }
  };

  const handleRepoReset = () => {
    setRepoAnalysis(null);
    setSkippedStats(null);
    setSelectedFilePath(null);
    setError(null);
    setSearchQuery('');
  };

  // Functional single file cleaning
  const handleCleanFile = async (filePath: string) => {
    if (!repoAnalysis) return;
    const file = repoAnalysis.files.find((f) => f.path === filePath);
    if (!file) return;

    try {
      const response = await fetch('/api/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: file.content, filename: file.path.split('/').pop() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error(data.error || 'Failed to clean file');
        return;
      }

      const cleanedCode = data.cleanedCode;
      const cleanedIssues = scanContent(cleanedCode, file.path, DEFAULT_ANALYZE_CONFIG);

      const updatedFiles = repoAnalysis.files.map((f) => {
        if (f.path === filePath) {
          return {
            ...f,
            cleanedContent: cleanedCode,
            cleanedBytes: new TextEncoder().encode(cleanedCode).length,
            issues: cleanedIssues,
            issueCount: cleanedIssues.length
          };
        }
        return f;
      });

      const totalIssues = updatedFiles.reduce((sum, f) => sum + f.issueCount, 0);

      setRepoAnalysis({
        ...repoAnalysis,
        files: updatedFiles,
        totalIssues
      });
    } catch (err) {
      console.error('Failed to communicate with cleaner api:', err);
    }
  };

  // Revert file cleaning
  const handleRevertFile = (filePath: string) => {
    if (!repoAnalysis) return;
    const file = repoAnalysis.files.find((f) => f.path === filePath);
    if (!file) return;

    // Scan original content to re-populate issues
    const originalIssues = scanContent(file.content, file.path, DEFAULT_ANALYZE_CONFIG);

    const updatedFiles = repoAnalysis.files.map((f) => {
      if (f.path === filePath) {
        return {
          ...f,
          cleanedContent: undefined,
          cleanedBytes: undefined,
          issues: originalIssues,
          issueCount: originalIssues.length
        };
      }
      return f;
    });

    const totalIssues = updatedFiles.reduce((sum, f) => sum + f.issueCount, 0);

    setRepoAnalysis({
      ...repoAnalysis,
      files: updatedFiles,
      totalIssues
    });
  };

  // Batch clean all files in the repository in chunks
  const handleBatchClean = async () => {
    if (!repoAnalysis || repoLoading) return;
    setRepoLoading(true);

    const filesToClean = repoAnalysis.files;
    const totalFiles = filesToClean.length;
    setRepoProgress({ current: 0, total: totalFiles });

    const updatedFiles = [...filesToClean];
    const chunkSize = 10;

    for (let i = 0; i < totalFiles; i += chunkSize) {
      const chunkEnd = Math.min(i + chunkSize, totalFiles);

      for (let j = i; j < chunkEnd; j++) {
        const file = filesToClean[j];
        const cleaned = cleanContent(file.content, file.path, DEFAULT_ANALYZE_CONFIG);
        const cleanedIssues = scanContent(cleaned, file.path, DEFAULT_ANALYZE_CONFIG);

        updatedFiles[j] = {
          ...file,
          cleanedContent: cleaned,
          cleanedBytes: new TextEncoder().encode(cleaned).length,
          issues: cleanedIssues,
          issueCount: cleanedIssues.length
        };
      }

      setRepoProgress({ current: chunkEnd, total: totalFiles });
      
      // Yield control to the UI event loop to render progress updates
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Recalculate repository-level metrics
    let totalIssues = 0;
    let totalComments = 0;
    let totalTodos = 0;
    let totalFixmes = 0;
    let totalConsoleLogs = 0;
    let totalBytesSaved = 0;

    updatedFiles.forEach((file) => {
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

    setRepoAnalysis({
      ...repoAnalysis,
      files: updatedFiles,
      totalIssues,
      totalBytesSaved,
      totalComments,
      totalTodos,
      totalFixmes,
      totalConsoleLogs
    });

    setRepoLoading(false);
    setRepoProgress(null);
  };

  const displayBytesLocal = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Generate and download reports (MD and JSON formats)
  const handleGenerateReport = () => {
    if (!repoAnalysis) return;

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

    const jsonBlob = new Blob([JSON.stringify(reportJsonObj, null, 2)], { type: 'application/json;charset=utf-8' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `${repoName}-report.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

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
    markdownContent += `| Total Bytes Saved | ${displayBytesLocal(repoAnalysis.totalBytesSaved)} |\n\n`;

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
      const originalSize = displayBytesLocal(file.originalBytes);
      const cleanedSize = file.cleanedBytes !== undefined ? displayBytesLocal(file.cleanedBytes) : originalSize;
      const saved = file.cleanedBytes !== undefined ? displayBytesLocal(Math.max(0, file.originalBytes - file.cleanedBytes)) : '0 B';
      const status = file.cleanedContent !== undefined ? '✅ Cleaned' : 'Original';
      markdownContent += `| \`${file.path}\` | ${originalSize} | ${cleanedSize} | ${saved} | ${file.issueCount} | ${status} |\n`;
    });

    const mdBlob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const mdUrl = URL.createObjectURL(mdBlob);
    const mdLink = document.createElement('a');
    mdLink.href = mdUrl;
    mdLink.download = `${repoName}-report.md`;
    mdLink.click();
    URL.revokeObjectURL(mdUrl);
  };

  // Export raw scan findings / analysis metrics
  const handleExportMetrics = () => {
    if (!repoAnalysis) return;

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

    const blob = new Blob([JSON.stringify(analysisJsonObj, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${repoName}-analysis.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedFile = repoAnalysis?.files.find((f) => f.path === selectedFilePath);

  const repoName = (() => {
    const firstPath = repoAnalysis?.files[0]?.path;
    if (!firstPath) return 'Repository Analysis';
    const segments = firstPath.split('/');
    if (segments.length > 1) {
      return segments[0]; // Shared root folder
    }
    return 'Repository Analysis';
  })();

  return (
    <div className="flex flex-col gap-6" id="repository-view">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-lg p-5 text-sm text-red-655 dark:text-red-400 font-semibold shadow-sm">
          {error}
        </div>
      )}

      {/* Upload Zone */}
      {!repoAnalysis && !repoLoading && !skippedStats && (
        <RepositoryUploader
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          isDragging={isDragging}
          onFolderUpload={handleFolderUpload}
        />
      )}

      {/* Skipped Diagnostics */}
      {skippedStats && !repoAnalysis && !repoLoading && (
        <RepositoryDiagnostics
          skippedStats={skippedStats}
          skippedFiles={skippedFiles}
          onReset={handleRepoReset}
        />
      )}

      {/* Progress Loader */}
      {repoLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-5">
          <svg className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-base text-zinc-650 dark:text-zinc-400 font-semibold">
            {repoProgress
              ? `Analyzing: ${repoProgress.current} / ${repoProgress.total} candidate files...`
              : 'Reading directory tree...'}
          </div>
        </div>
      )}

      {/* Scanned workspace view */}
      {repoAnalysis && !repoLoading && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          <RepositoryHeader
            repoName={repoName}
            repoAnalysis={repoAnalysis}
            skippedFilesCount={skippedFiles.length}
            onReset={handleRepoReset}
            onBatchClean={handleBatchClean}
            onGenerateReport={handleGenerateReport}
            onExportMetrics={handleExportMetrics}
            isCleaning={repoLoading}
          />

          <div className="grid md:grid-cols-3 gap-8 items-stretch min-h-[460px]">
            {/* Left Explorer Sidebar */}
            <div className="col-span-1 border-r border-zinc-200 dark:border-zinc-800 pr-5">
              <RepositoryExplorer
                files={repoAnalysis.files}
                selectedFilePath={selectedFilePath}
                setSelectedFilePath={setSelectedFilePath}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* Right Details Panel */}
            <div className="col-span-2 pl-3">
              {selectedFile ? (
                <RepositoryDetails
                  file={selectedFile}
                  onCleanFile={handleCleanFile}
                  onRevertFile={handleRevertFile}
                />
              ) : (
                <div className="flex-1 h-full flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-850 rounded-xl p-8 text-center text-zinc-500 text-sm bg-zinc-50/50 dark:bg-zinc-950/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Select a file from the explorer sidebar to view its detailed code analysis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

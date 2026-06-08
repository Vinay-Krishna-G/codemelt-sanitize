'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import { scanContent } from 'codemelt-sanitize-core/dist/scanner.js';
import { cleanContent } from 'codemelt-sanitize-core/dist/cleaner.js';
import { SUPPORTED_EXTENSIONS } from 'codemelt-sanitize-shared';
import type { Issue } from 'codemelt-sanitize-core';
import { AnalyzeResponse, CleanResponse } from '../types/sanitize';
import { DEFAULT_ANALYZE_CONFIG } from '../lib/default-config';
import IssueCard from './issue-card';

export default function AnalyzerClient() {
  const [activeTab, setActiveTab] = useState<'single' | 'repository'>('single');

  // ==========================================
  // SINGLE FILE STATE & LOGIC
  // ==========================================
  const [filename, setFilename] = useState('input.js');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Scanned / Analysis State
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Cleaning State
  const [cleanResult, setCleanResult] = useState<CleanResponse | null>(null);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanCodeCopied, setCleanCodeCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const loadExample = () => {
    const exampleCode = `// TODO: remove before release

function calculateTotal(items) {
  console.log("calculating");

  return items.reduce(
    (sum, item) => sum + item.price,
    0
  );
}

// FIXME: handle empty array`;
    
    setCode(exampleCode);
    setFilename('calculate.js');
    setResult(null);
    setCleanResult(null);
    setShowComparison(false);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Code cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, filename }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to analyze code');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to communicate with analysis server');
    } finally {
      setLoading(false);
    }
  };

  const handleClean = async () => {
    if (!code.trim()) {
      setError('Code cannot be empty');
      return;
    }

    setCleanLoading(true);
    setError(null);
    setCleanCodeCopied(false);

    try {
      const response = await fetch('/api/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, filename }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to clean code');
      } else {
        setCleanResult(data);
      }
    } catch (err) {
      setError('Failed to communicate with analysis server');
    } finally {
      setCleanLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy results to clipboard');
    }
  };

  const copyCleanedCode = async () => {
    if (!cleanResult) return;
    try {
      await navigator.clipboard.writeText(cleanResult.cleanedCode);
      setCleanCodeCopied(true);
      setTimeout(() => setCleanCodeCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy cleaned code');
    }
  };

  const downloadCleanedFile = () => {
    if (!cleanResult) return;
    const blob = new Blob([cleanResult.cleanedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanResult.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    if (!cleanResult) return;
    const report = {
      filename: cleanResult.filename,
      summary: cleanResult.summary,
      generatedAt: new Date().toISOString(),
      version: cleanResult.version
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sanitize-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCode('');
    setFilename('input.js');
    setCleanResult(null);
    setResult(null);
    setShowComparison(false);
    setError(null);
    setCleanCodeCopied(false);
    setCopied(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // ==========================================
  // REPOSITORY MODE STATE & LOGIC
  // ==========================================
  const [files, setFiles] = useState<{ path: string; content: string; size: number }[]>([]);
  const [skippedFiles, setSkippedFiles] = useState<{ path: string; reason: string }[]>([]);
  const [repoIssues, setRepoIssues] = useState<{ path: string; issues: Issue[] }[]>([]);
  const [repoCleanResult, setRepoCleanResult] = useState<{
    filesCleaned: number;
    bytesSaved: number;
    cleanedFiles: { path: string; content: string }[];
  } | null>(null);
  const [repoScanning, setRepoScanning] = useState(false);
  const [repoCleanLoading, setRepoCleanLoading] = useState(false);
  const [repoProgress, setRepoProgress] = useState<{ current: number; total: number } | null>(null);
  const [repoExpandedFile, setRepoExpandedFile] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setRepoScanning(true);
    setFiles([]);
    setSkippedFiles([]);
    setRepoIssues([]);
    setRepoCleanResult(null);
    setZipFile(null);
    setError(null);

    const readFiles: { path: string; content: string; size: number }[] = [];
    const skipped: { path: string; reason: string }[] = [];

    const totalFiles = fileList.length;
    let processed = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;
      const normalizedPath = relPath.replace(/\\/g, '/');
      const pathSegments = normalizedPath.toLowerCase().split('/');

      const isExcluded = pathSegments.some(segment =>
        ['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage'].includes(segment)
      );

      if (isExcluded) {
        skipped.push({ path: normalizedPath, reason: 'excluded directory' });
        processed++;
        continue;
      }

      const dotIndex = file.name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? file.name.substring(dotIndex).toLowerCase() : '';
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        skipped.push({ path: normalizedPath, reason: 'unsupported extension' });
        processed++;
        continue;
      }

      try {
        const content = await file.text();
        const size = new TextEncoder().encode(content).length;
        readFiles.push({ path: normalizedPath, content, size });
      } catch (err) {
        skipped.push({ path: normalizedPath, reason: 'failed to read file' });
      }

      processed++;
      setRepoProgress({ current: processed, total: totalFiles });
    }

    const scanResults: { path: string; issues: Issue[] }[] = [];
    for (const file of readFiles) {
      const issues = scanContent(file.content, file.path, DEFAULT_ANALYZE_CONFIG);
      if (issues.length > 0) {
        scanResults.push({ path: file.path, issues });
      }
    }

    setFiles(readFiles);
    setSkippedFiles(skipped);
    setRepoIssues(scanResults);
    setRepoScanning(false);
    setRepoProgress(null);
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRepoScanning(true);
    setFiles([]);
    setSkippedFiles([]);
    setRepoIssues([]);
    setRepoCleanResult(null);
    setZipFile(file);
    setError(null);

    const readFiles: { path: string; content: string; size: number }[] = [];
    const skipped: { path: string; reason: string }[] = [];

    try {
      const zip = await JSZip.loadAsync(file);
      const zipEntries = Object.keys(zip.files);
      const totalFiles = zipEntries.length;
      let processed = 0;

      for (const relativePath of zipEntries) {
        const entry = zip.files[relativePath];
        if (entry.dir) {
          processed++;
          continue;
        }

        const normalizedPath = relativePath.replace(/\\/g, '/');
        const pathSegments = normalizedPath.toLowerCase().split('/');

        const isExcluded = pathSegments.some(segment =>
          ['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage'].includes(segment)
        );

        if (isExcluded) {
          skipped.push({ path: normalizedPath, reason: 'excluded directory' });
          processed++;
          continue;
        }

        const dotIndex = normalizedPath.lastIndexOf('.');
        const ext = dotIndex !== -1 ? normalizedPath.substring(dotIndex).toLowerCase() : '';
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
          skipped.push({ path: normalizedPath, reason: 'unsupported extension' });
          processed++;
          continue;
        }

        try {
          const content = await entry.async('string');
          const size = new TextEncoder().encode(content).length;
          readFiles.push({ path: normalizedPath, content, size });
        } catch (err) {
          skipped.push({ path: normalizedPath, reason: 'failed to read zip entry' });
        }

        processed++;
        setRepoProgress({ current: processed, total: totalFiles });
      }

      const scanResults: { path: string; issues: Issue[] }[] = [];
      for (const file of readFiles) {
        const issues = scanContent(file.content, file.path, DEFAULT_ANALYZE_CONFIG);
        if (issues.length > 0) {
          scanResults.push({ path: file.path, issues });
        }
      }

      setFiles(readFiles);
      setSkippedFiles(skipped);
      setRepoIssues(scanResults);
    } catch (err) {
      setError('Failed to extract and read ZIP file');
    } finally {
      setRepoScanning(false);
      setRepoProgress(null);
    }
  };

  const handleCleanRepo = async () => {
    if (files.length === 0) return;

    setRepoCleanLoading(true);
    setError(null);

    let bytesSaved = 0;
    let filesCleaned = 0;
    const cleaned: { path: string; content: string }[] = [];

    for (const file of files) {
      const fileIssues = repoIssues.find(item => item.path === file.path);

      if (fileIssues && fileIssues.issues.length > 0) {
        const cleanedContent = cleanContent(file.content, file.path, DEFAULT_ANALYZE_CONFIG);
        const originalBytes = file.size;
        const cleanedBytes = new TextEncoder().encode(cleanedContent).length;

        if (cleanedContent !== file.content) {
          bytesSaved += Math.max(0, originalBytes - cleanedBytes);
          filesCleaned++;
        }
        cleaned.push({ path: file.path, content: cleanedContent });
      } else {
        cleaned.push({ path: file.path, content: file.content });
      }
    }

    setRepoCleanResult({
      filesCleaned,
      bytesSaved,
      cleanedFiles: cleaned
    });
    setRepoCleanLoading(false);
  };

  const downloadCleanedRepo = async () => {
    if (!repoCleanResult) return;

    setRepoCleanLoading(true);
    try {
      let zip: JSZip;
      if (zipFile) {
        zip = await JSZip.loadAsync(zipFile);
      } else {
        zip = new JSZip();
      }

      for (const cleaned of repoCleanResult.cleanedFiles) {
        zip.file(cleaned.path, cleaned.content);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFile ? `cleaned-${zipFile.name}` : 'repository-cleaned.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate cleaned repository ZIP');
    } finally {
      setRepoCleanLoading(false);
    }
  };

  const downloadRepoReport = () => {
    if (!repoIssues) return;

    const totalOriginalIssues = repoIssues.reduce((sum, item) => sum + item.issues.length, 0);
    const filesWithIssuesCount = repoIssues.length;

    const report = {
      summary: {
        totalFilesScanned: files.length,
        skippedFilesCount: skippedFiles.length,
        filesWithIssuesCount,
        totalIssuesCount: totalOriginalIssues,
        filesCleaned: repoCleanResult ? repoCleanResult.filesCleaned : 0,
        bytesSaved: repoCleanResult ? repoCleanResult.bytesSaved : 0
      },
      filesWithIssues: repoIssues.map(item => ({
        filePath: item.path,
        issuesCount: item.issues.length,
        issues: item.issues.map(i => ({
          line: i.line,
          type: i.type,
          message: i.message,
          rawContent: i.rawContent
        }))
      })),
      skippedFiles: skippedFiles.map(item => ({
        filePath: item.path,
        reason: item.reason
      })),
      generatedAt: new Date().toISOString(),
      product: 'CodeMelt Sanitize',
      version: '0.1.0'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'repository-sanitize-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRepoReset = () => {
    setFiles([]);
    setSkippedFiles([]);
    setRepoIssues([]);
    setRepoCleanResult(null);
    setZipFile(null);
    setError(null);
    setRepoExpandedFile(null);
  };

  // Render Single File Tab Comparison Mode
  if (activeTab === 'single' && showComparison && cleanResult) {
    return (
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 flex flex-col gap-6 animate-fadeIn" id="comparison-view">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-500/10 rounded text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">Cleaned Output Comparison</h2>
            </div>
            <p className="text-xs text-zinc-500 font-medium pl-8">
              Comparing changes for <span className="text-zinc-300 font-bold">{cleanResult.filename}</span>
            </p>
          </div>
          
          <button
            onClick={() => setShowComparison(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-950 rounded-lg text-sm font-medium transition-colors border border-zinc-800 self-start sm:self-auto"
          >
            Back to Summary
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="text-2xl font-bold tracking-tight text-zinc-400">{formatBytes(cleanResult.summary.originalBytes)}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Original Size</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="text-2xl font-bold tracking-tight text-emerald-400">{formatBytes(cleanResult.summary.cleanedBytes)}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Cleaned Size</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="text-2xl font-bold tracking-tight text-emerald-400">-{formatBytes(cleanResult.summary.bytesSaved)}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Bytes Saved</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="text-2xl font-bold tracking-tight text-emerald-400">{cleanResult.summary.issuesRemoved}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Issues Removed</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1 relative overflow-hidden">
            <div className="text-2xl font-bold tracking-tight text-emerald-400">{cleanResult.summary.percentReduction}%</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Reduction %</div>
          </div>

        </div>

        {/* Code Split View */}
        <div className="grid md:grid-cols-2 gap-4 items-stretch">
          
          {/* Left: Original Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pl-1">Original Code</label>
            <pre className="text-xs font-mono text-zinc-400 bg-black/30 border border-zinc-800 p-4 rounded-lg overflow-auto max-h-[350px] whitespace-pre-wrap break-all min-h-[200px]">
              {cleanResult.originalCode}
            </pre>
          </div>

          {/* Right: Cleaned Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pl-1">Cleaned Code</label>
            <pre className="text-xs font-mono text-zinc-200 bg-black/30 border border-emerald-500/20 p-4 rounded-lg overflow-auto max-h-[350px] whitespace-pre-wrap break-all min-h-[200px]">
              {cleanResult.cleanedCode || '/* File is empty after cleaning */'}
            </pre>
          </div>

        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-5">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-semibold transition-all"
          >
            Reset
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyCleanedCode}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              {cleanCodeCopied ? 'Copied!' : 'Copy Cleaned Code'}
            </button>

            <button
              onClick={downloadCleanedFile}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Cleaned File
            </button>

            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Download Report
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl p-0 shadow-2xl text-zinc-100 flex flex-col overflow-hidden" id="analyzer">
      
      {/* Tab Selector Header */}
      <div className="flex border-b border-zinc-800 bg-zinc-950/40">
        <button
          onClick={() => setActiveTab('single')}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'single'
              ? 'border-blue-500 text-white bg-zinc-900/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Single File
        </button>
        <button
          onClick={() => setActiveTab('repository')}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'repository'
              ? 'border-blue-500 text-white bg-zinc-900/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          Repository Mode
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 flex flex-col gap-6">

        {activeTab === 'single' ? (
          <>
            {/* File Configuration Section */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Target Filename</label>
                <input
                  id="filename-input"
                  type="text"
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-zinc-700"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </div>
              <button
                onClick={loadExample}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-950 rounded-lg text-sm font-medium transition-colors border border-zinc-800"
              >
                Load Example
              </button>
            </div>

            {/* Editor / Text Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Source Code</label>
              <textarea
                id="code-input"
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-zinc-700 min-h-[220px] text-zinc-300"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste or write your source code here..."
              />
            </div>

            {/* Action panel & Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-800 pt-4">
              
              {/* Dynamic Metadata Section */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                <div>
                  <span className="text-zinc-500">Filename:</span> <span className="font-semibold text-zinc-300">{filename || 'None'}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                <div>
                  <span className="text-zinc-500">Characters:</span> <span className="font-semibold text-zinc-300">{code.length}</span>
                </div>
                {result && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                    <div>
                      <span className="text-zinc-500">Last Analysis:</span>{' '}
                      <span className="font-bold text-emerald-400">
                        {result.summary.total} {result.summary.total === 1 ? 'Issue' : 'Issues'} Found
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Scan & Clean Actions */}
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                {error && <span className="text-red-400 text-sm font-medium mr-2">{error}</span>}
                
                <button
                  id="analyze-btn"
                  disabled={loading || cleanLoading}
                  onClick={handleAnalyze}
                  className="px-6 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    'Analyze'
                  )}
                </button>

                <button
                  id="clean-btn"
                  disabled={loading || cleanLoading}
                  onClick={handleClean}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  {cleanLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cleaning...
                    </>
                  ) : (
                    'Clean Code'
                  )}
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {cleanResult && !showComparison && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                      ✓ Code Sanitized Successfully
                    </h3>
                    <div className="text-xs text-zinc-300 mt-1 font-semibold flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {cleanResult.summary.issuesRemoved} {cleanResult.summary.issuesRemoved === 1 ? 'Issue' : 'Issues'} Removed
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {formatBytes(cleanResult.summary.bytesSaved)} Saved
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase mt-2">Ready for AI sharing.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowComparison(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all self-start sm:self-auto"
                >
                  View Comparison
                </button>
              </div>
            )}

            {result && (
              <div className="flex flex-col gap-6 border-t border-zinc-800 pt-6">
                
                {/* Summary Dashboard Cards */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Analysis Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden group transition-all duration-300 hover:border-zinc-800">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-600"></div>
                      <div className="text-3xl font-bold tracking-tight text-zinc-100">{result.summary.comments}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Comments</div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden group transition-all duration-300 hover:border-amber-500/30">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-amber-400">{result.summary.todos}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">TODOs</div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden group transition-all duration-300 hover:border-rose-500/30">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-rose-400">{result.summary.fixmes}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">FIXMEs</div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden group transition-all duration-300 hover:border-blue-500/30">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-blue-400">{result.summary.consoleLogs}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Logs</div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1 relative overflow-hidden group transition-all duration-300 hover:border-emerald-500/30">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-emerald-400">{result.summary.total}</div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">Total</div>
                    </div>

                  </div>
                </div>

                {/* Structured Issue Listings */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Scan Results</h3>
                  {result.issues.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[320px] overflow-auto border border-zinc-800 rounded-lg p-3 bg-black/20">
                      {result.issues.map((issue, idx) => (
                        <IssueCard key={issue.id || idx} issue={issue} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-black/20 border border-zinc-800 rounded-lg p-6 text-center text-zinc-500 text-sm">
                      No issues detected in the scanned content.
                    </div>
                  )}
                </div>

                {/* Collapsible JSON Output Panel */}
                <details className="group border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/20">
                  <summary className="flex justify-between items-center px-4 py-3 cursor-pointer select-none font-semibold text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                    <span>Raw JSON Output</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyToClipboard();
                        }}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-xs font-semibold border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-300"
                      >
                        {copied ? 'Copied!' : 'Copy Results'}
                      </button>
                      <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div className="border-t border-zinc-800 bg-black/40">
                    <pre
                      id="result-panel"
                      className="p-4 text-xs font-mono overflow-auto max-h-[300px] text-zinc-300"
                    >
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </details>

              </div>
            )}
          </>
        ) : (
          // ==========================================
          // REPOSITORY MODE VIEW
          // ==========================================
          <div className="flex flex-col gap-6" id="repository-view">
            
            {error && (
              <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-4 text-sm text-red-400 font-semibold">
                {error}
              </div>
            )}

            {/* Step 1: Upload Selectors */}
            {files.length === 0 && skippedFiles.length === 0 && !repoScanning && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-12 text-center transition-all bg-zinc-950/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-zinc-650 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                
                <h3 className="font-bold text-white mb-1">Upload repository files</h3>
                <p className="text-xs text-zinc-500 max-w-sm mb-6">
                  Select a local repository folder or upload a ZIP archive to scan and clean comments, TODOs, and console logs.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Folder input */}
                  <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-md shadow-blue-900/10 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                    Upload Folder
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFolderUpload}
                      {...{ webkitdirectory: '', directory: '' }}
                    />
                  </label>

                  {/* ZIP input */}
                  <label className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-900 text-zinc-200 border border-zinc-700 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    Upload ZIP
                    <input type="file" accept=".zip" className="hidden" onChange={handleZipUpload} />
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Scanning Loading State */}
            {repoScanning && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-sm text-zinc-400 font-semibold">
                  {repoProgress
                    ? `Processing: ${repoProgress.current} / ${repoProgress.total} files...`
                    : 'Reading files from upload...'}
                </div>
              </div>
            )}

            {/* Step 3: Scanned Repository State Dashboard */}
            {files.length > 0 && !repoScanning && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                
                {/* Repository Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                    <div className="text-2xl font-bold tracking-tight text-zinc-200">{files.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Scanned Files</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                    <div className="text-2xl font-bold tracking-tight text-zinc-400">{skippedFiles.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Skipped Files</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <div className="text-2xl font-bold tracking-tight text-blue-450">
                      {repoIssues.reduce((sum, item) => sum + item.issues.length, 0)}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Issues Found</div>
                  </div>
                </div>

                {/* Initial Scan Actions */}
                {!repoCleanResult && (
                  <div className="flex justify-between items-center border-t border-zinc-800 pt-4">
                    <button
                      onClick={handleRepoReset}
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-semibold transition-all"
                    >
                      Reset
                    </button>
                    
                    <button
                      onClick={handleCleanRepo}
                      disabled={repoCleanLoading}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-50 rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2"
                    >
                      {repoCleanLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Cleaning...
                        </>
                      ) : (
                        'Clean Repository'
                      )}
                    </button>
                  </div>
                )}

                {/* Clean Results & Exports */}
                {repoCleanResult && (
                  <div className="flex flex-col gap-4 border-t border-zinc-855 pt-4">
                    
                    {/* Repository Success Banner */}
                    <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <h3 className="font-bold text-emerald-400 text-sm">
                            ✓ Repository Sanitized Successfully
                          </h3>
                          <div className="text-xs text-zinc-300 mt-1 font-semibold flex flex-col gap-1">
                            <div>{repoCleanResult.filesCleaned} {repoCleanResult.filesCleaned === 1 ? 'File' : 'Files'} Cleaned</div>
                            <div>{formatBytes(repoCleanResult.bytesSaved)} Saved</div>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase mt-2">Ready for AI sharing.</p>
                        </div>
                      </div>
                    </div>

                    {/* Repository Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                      <button
                        onClick={handleRepoReset}
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-semibold transition-all"
                      >
                        Reset
                      </button>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={downloadRepoReport}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          Download JSON Report
                        </button>

                        <button
                          onClick={downloadCleanedRepo}
                          disabled={repoCleanLoading}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download Cleaned Repository
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Files with Issues List */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Scan Results - Files with Issues ({repoIssues.length})</h3>
                  {repoIssues.length > 0 ? (
                    <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto border border-zinc-800 rounded-lg p-3 bg-black/20">
                      {repoIssues.map((item) => {
                        const isExpanded = repoExpandedFile === item.path;
                        return (
                          <div key={item.path} className="border border-zinc-800 rounded-lg bg-zinc-950/40 overflow-hidden">
                            <button
                              onClick={() => setRepoExpandedFile(isExpanded ? null : item.path)}
                              className="w-full flex items-center justify-between p-3 hover:bg-zinc-900/40 text-left transition-colors"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <span className="p-1 bg-zinc-800 rounded text-zinc-400 flex-shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 9H12m0 0v-1.5m0 1.5v1.5m0-1.5h1.5m-7.487 1.487L6 16.5m0 0L3.75 18.75M6 16.5v-1.5m0 1.5H7.5" />
                                  </svg>
                                </span>
                                <span className="text-xs font-semibold text-zinc-350 truncate">{item.path}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {item.issues.length} {item.issues.length === 1 ? 'Issue' : 'Issues'}
                                </span>
                                <svg className={`w-3.5 h-3.5 text-zinc-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="p-3 border-t border-zinc-900 bg-zinc-950/20 flex flex-col gap-2">
                                {item.issues.map((issue, idx) => (
                                  <IssueCard key={issue.id || idx} issue={issue} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-black/20 border border-zinc-800 rounded-lg p-8 text-center text-zinc-500 text-sm">
                      No issues detected in the repository structure.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

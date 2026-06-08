'use client';

import React, { useState } from 'react';
import { scanContent } from 'codemelt-sanitize-core/dist/scanner.js';
import { SUPPORTED_EXTENSIONS } from 'codemelt-sanitize-shared';
import { AnalyzeResponse, CleanResponse, RepositoryAnalysis, RepositoryFile } from '../types/sanitize';
import { DEFAULT_ANALYZE_CONFIG } from '../lib/default-config';
import IssueCard from './issue-card';

// Repository Mode Limits
const MAX_FILES = 1000;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE = 500 * 1024; // 500KB

export default function AnalyzerClient() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'clean' | 'repository'>('analyze');

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
    } catch {
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
        setActiveTab('clean'); // Switch to Clean tab to show differences
      }
    } catch {
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
    } catch {
      setError('Failed to copy results to clipboard');
    }
  };

  const copyCleanedCode = async () => {
    if (!cleanResult) return;
    try {
      await navigator.clipboard.writeText(cleanResult.cleanedCode);
      setCleanCodeCopied(true);
      setTimeout(() => setCleanCodeCopied(false), 2000);
    } catch {
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
  const [repoAnalysis, setRepoAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoProgress, setRepoProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (fileList: File[]) => {
    setRepoLoading(true);
    setError(null);
    setRepoProgress({ current: 0, total: fileList.length });
    
    // Safety check: total file count limit
    if (fileList.length > MAX_FILES) {
      setError(`Repository contains too many files (maximum is ${MAX_FILES} files).`);
      setRepoLoading(false);
      setRepoProgress(null);
      return;
    }
    
    // Safety check: total size limit
    let totalSizeBytes = 0;
    for (let i = 0; i < fileList.length; i++) {
      totalSizeBytes += fileList[i].size;
    }
    if (totalSizeBytes > MAX_TOTAL_SIZE) {
      setError(`Total repository size exceeds the maximum limit of 10MB.`);
      setRepoLoading(false);
      setRepoProgress(null);
      return;
    }
    
    const analyzedFiles: RepositoryFile[] = [];
    let totalIssues = 0;
    let totalComments = 0;
    let totalTodos = 0;
    let totalFixmes = 0;
    let totalConsoleLogs = 0;
    
    let processedCount = 0;
    
    for (const file of fileList) {
      const relPath = file.webkitRelativePath || file.name;
      const normalizedPath = relPath.replace(/\\/g, '/');
      const pathSegments = normalizedPath.toLowerCase().split('/');
      
      // Filter directories in ignored lists
      const isExcluded = pathSegments.some(segment =>
        ['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage'].includes(segment)
      );
      
      if (isExcluded) {
        processedCount++;
        setRepoProgress({ current: processedCount, total: fileList.length });
        continue;
      }
      
      // Filter unsupported file extensions
      const dotIndex = file.name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? file.name.substring(dotIndex).toLowerCase() : '';
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        processedCount++;
        setRepoProgress({ current: processedCount, total: fileList.length });
        continue;
      }
      
      // Safety check: individual file size limit
      if (file.size > MAX_FILE_SIZE) {
        processedCount++;
        setRepoProgress({ current: processedCount, total: fileList.length });
        continue;
      }
      
      try {
        const content = await file.text();
        const issues = scanContent(content, normalizedPath, DEFAULT_ANALYZE_CONFIG);
        const originalBytes = new TextEncoder().encode(content).length;
        
        // Categorize issues
        const countByType = (type: string) => issues.filter(i => i.type === type).length;
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
      setRepoProgress({ current: processedCount, total: fileList.length });
    }
    
    if (analyzedFiles.length === 0) {
      setError('No supported source-code or text files were found in the selected folder.');
      setRepoLoading(false);
      setRepoProgress(null);
      return;
    }
    
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
    setSelectedFilePath(null);
    setError(null);
    setSearchQuery('');
  };

  const selectedFile = repoAnalysis?.files.find(f => f.path === selectedFilePath);
  const filteredRepoFiles = repoAnalysis
    ? repoAnalysis.files.filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl p-0 shadow-2xl text-zinc-100 flex flex-col overflow-hidden" id="analyzer">
      
      {/* Tab Header Selector */}
      <div className="flex border-b border-zinc-800 bg-zinc-950/40">
        <button
          onClick={() => {
            setActiveTab('analyze');
            setError(null);
          }}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'analyze'
              ? 'border-blue-500 text-white bg-zinc-900/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Analyze File
        </button>
        <button
          onClick={() => {
            setActiveTab('clean');
            setError(null);
          }}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'clean'
              ? 'border-blue-500 text-white bg-zinc-900/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-9-5.25h12M3.75 6.75h16.5" />
          </svg>
          Clean File
        </button>
        <button
          onClick={() => {
            setActiveTab('repository');
            setError(null);
          }}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'repository'
              ? 'border-blue-500 text-white bg-zinc-900/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          Repository Workspace
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        
        {/* ========================== TAB 1: ANALYZE ========================== */}
        {activeTab === 'analyze' && (
          <>
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-800 pt-4">
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

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                {error && <span className="text-red-400 text-sm font-medium mr-2">{error}</span>}
                
                <button
                  id="analyze-btn"
                  disabled={loading || cleanLoading}
                  onClick={handleAnalyze}
                  className="px-6 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>

                <button
                  id="clean-btn"
                  disabled={loading || cleanLoading}
                  onClick={handleClean}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  {cleanLoading ? 'Cleaning...' : 'Clean Code'}
                </button>
              </div>
            </div>

            {result && (
              <div className="flex flex-col gap-6 border-t border-zinc-800 pt-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Analysis Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-650"></div>
                      <div className="text-3xl font-bold tracking-tight text-zinc-100">{result.summary.comments}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Comments</div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-amber-400">{result.summary.todos}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">TODOs</div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-rose-400">{result.summary.fixmes}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">FIXMEs</div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-blue-400">{result.summary.consoleLogs}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Logs</div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                      <div className="text-3xl font-bold tracking-tight text-emerald-400">{result.summary.total}</div>
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">Total</div>
                    </div>
                  </div>
                </div>

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
                    <pre id="result-panel" className="p-4 text-xs font-mono overflow-auto max-h-[300px] text-zinc-300">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </>
        )}

        {/* ========================== TAB 2: CLEAN ========================== */}
        {activeTab === 'clean' && (
          <div className="flex flex-col gap-6">
            {cleanResult ? (
              <div className="flex flex-col gap-6 animate-fadeIn">
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
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                    <div className="text-2xl font-bold tracking-tight text-emerald-400">{cleanResult.summary.percentReduction}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Reduction %</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 items-stretch">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pl-1">Original Code</label>
                    <pre className="text-xs font-mono text-zinc-400 bg-black/30 border border-zinc-800 p-4 rounded-lg overflow-auto max-h-[350px] whitespace-pre-wrap break-all min-h-[200px]">
                      {cleanResult.originalCode}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pl-1">Cleaned Code</label>
                    <pre className="text-xs font-mono text-zinc-200 bg-black/30 border border-emerald-500/20 p-4 rounded-lg overflow-auto max-h-[350px] whitespace-pre-wrap break-all min-h-[200px]">
                      {cleanResult.cleanedCode || '/* File is empty after cleaning */'}
                    </pre>
                  </div>
                </div>

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
                      {cleanCodeCopied ? 'Copied!' : 'Copy Cleaned Code'}
                    </button>
                    <button
                      onClick={downloadCleanedFile}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      Download Cleaned File
                    </button>
                    <button
                      onClick={downloadReport}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      Download Report
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-black/20 border border-zinc-800 rounded-lg p-12 text-center text-zinc-500 text-sm">
                No cleaned content available yet. Enter code in the Analyze File tab, then click the Clean Code button.
              </div>
            )}
          </div>
        )}

        {/* ========================== TAB 3: REPOSITORY ========================== */}
        {activeTab === 'repository' && (
          <div className="flex flex-col gap-6" id="repository-view">
            
            {error && (
              <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-4 text-sm text-red-400 font-semibold">
                {error}
              </div>
            )}

            {/* Folder Selection Zone */}
            {!repoAnalysis && !repoLoading && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center transition-all bg-zinc-950/20 ${
                  isDragging ? 'border-blue-500 bg-zinc-900/30' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-zinc-600 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                
                <h3 className="font-bold text-white mb-1">Select local repository folder</h3>
                <p className="text-xs text-zinc-500 max-w-sm mb-6">
                  Drag and drop a folder here, or click upload to scan code files client-side.
                </p>

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
              </div>
            )}

            {/* Folder Scan Progress Loading */}
            {repoLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-sm text-zinc-400 font-semibold">
                  {repoProgress
                    ? `Analyzing: ${repoProgress.current} / ${repoProgress.total} files...`
                    : 'Reading directory tree...'}
                </div>
              </div>
            )}

            {/* Repository Workspace Explorer Panel */}
            {repoAnalysis && !repoLoading && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                
                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                    <div className="text-2xl font-bold tracking-tight text-zinc-200">{repoAnalysis.totalFiles}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Scanned Files</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                    <div className="text-2xl font-bold tracking-tight text-zinc-350">{formatBytes(repoAnalysis.totalBytes)}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Total Size</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <div className="text-2xl font-bold tracking-tight text-blue-400">{repoAnalysis.totalIssues}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Issues Found</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-left pl-5 relative overflow-hidden flex flex-col justify-center">
                    <div className="text-xs text-zinc-400 flex flex-col gap-0.5 leading-normal">
                      <div>Comments: <span className="font-semibold text-zinc-300">{repoAnalysis.totalComments}</span></div>
                      <div>TODOs: <span className="font-semibold text-amber-400">{repoAnalysis.totalTodos}</span></div>
                      <div>FIXMEs: <span className="font-semibold text-rose-400">{repoAnalysis.totalFixmes}</span></div>
                      <div>Logs: <span className="font-semibold text-blue-400">{repoAnalysis.totalConsoleLogs}</span></div>
                    </div>
                  </div>
                </div>

                {/* Reset button at the top header */}
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Repository Explorer Workspace</h3>
                  <button
                    onClick={handleRepoReset}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-950 rounded-lg text-xs font-semibold border border-zinc-800 transition-colors"
                  >
                    Reset Workspace
                  </button>
                </div>

                {/* Dual-Pane Workspace Grid */}
                <div className="grid md:grid-cols-3 gap-6 items-stretch min-h-[450px]">
                  
                  {/* Left Sidebar Pane: File Explorer */}
                  <div className="col-span-1 border-r border-zinc-800 pr-4 flex flex-col gap-3">
                    
                    {/* Search Field */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter files..."
                        className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs w-full focus:outline-none focus:border-zinc-700 text-zinc-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                      </svg>
                    </div>

                    {/* Explorer List */}
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[380px] pr-1">
                      {filteredRepoFiles.map((file) => {
                        const isSelected = selectedFilePath === file.path;
                        return (
                          <button
                            key={file.path}
                            onClick={() => setSelectedFilePath(file.path)}
                            className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors group ${
                              isSelected 
                                ? 'bg-zinc-800 text-white font-medium' 
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                            }`}
                          >
                            <span className="text-xs truncate max-w-[170px]" title={file.path}>
                              {file.path}
                            </span>
                            {file.issueCount > 0 && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                isSelected 
                                  ? 'bg-blue-500/20 text-blue-300' 
                                  : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                              }`}>
                                {file.issueCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {filteredRepoFiles.length === 0 && (
                        <div className="text-xs text-zinc-500 p-2 text-center">
                          No matching files found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Panel: File Details & Preview */}
                  <div className="col-span-2 pl-2 flex flex-col gap-4">
                    
                    {selectedFile ? (
                      <div className="flex flex-col gap-4 animate-fadeIn">
                        
                        {/* File Detail Stats */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800">
                          <div className="flex flex-col gap-0.5 max-w-[280px]">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">File Selected</span>
                            <span className="text-xs text-zinc-300 font-mono font-bold truncate" title={selectedFile.path}>{selectedFile.path}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-semibold">
                            <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
                              Size: {formatBytes(selectedFile.originalBytes)}
                            </span>
                            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              {selectedFile.issueCount} {selectedFile.issueCount === 1 ? 'Issue' : 'Issues'}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Issues list */}
                        {selectedFile.issueCount > 0 ? (
                          <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Scan Details</h4>
                            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto border border-zinc-800 rounded-lg p-2.5 bg-black/20">
                              {selectedFile.issues.map((issue, idx) => (
                                <IssueCard key={issue.id || idx} issue={issue} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-black/20 border border-zinc-800 rounded-lg p-4 text-center text-zinc-500 text-xs font-medium">
                            No issues detected in this file.
                          </div>
                        )}

                        {/* Raw Code Preview */}
                        <div className="flex flex-col gap-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Source Code Preview</h4>
                          <pre className="text-xs font-mono text-zinc-350 bg-black/30 border border-zinc-800 p-4 rounded-lg overflow-auto max-h-[220px] whitespace-pre-wrap break-all leading-relaxed">
                            {selectedFile.content || '/* Empty File */'}
                          </pre>
                        </div>

                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center border border-zinc-800 rounded-lg p-6 text-center text-zinc-500 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-zinc-600 mb-2">
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
        )}

      </div>
    </div>
  );
}

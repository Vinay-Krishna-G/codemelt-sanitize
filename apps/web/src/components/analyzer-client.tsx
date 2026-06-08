'use client';

import React, { useState } from 'react';
import { AnalyzeResponse, CleanResponse } from '../types/sanitize';
import IssueCard from './issue-card';
import RepositoryTab from './repository/RepositoryTab';

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

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0 shadow-2xl text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden transition-all duration-200" id="analyzer">
      
      {/* Tab Header Selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-950/40">
        <button
          onClick={() => {
            setActiveTab('analyze');
            setError(null);
          }}
          className={`px-6 py-4.5 text-base font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'analyze'
              ? 'border-blue-600 dark:border-blue-500 text-zinc-950 dark:text-white bg-white dark:bg-zinc-900/10'
              : 'border-transparent text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Analyze file
        </button>
        <button
          onClick={() => {
            setActiveTab('clean');
            setError(null);
          }}
          className={`px-6 py-4.5 text-base font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'clean'
              ? 'border-blue-600 dark:border-blue-500 text-zinc-950 dark:text-white bg-white dark:bg-zinc-900/10'
              : 'border-transparent text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-9-5.25h12M3.75 6.75h16.5" />
          </svg>
          Clean file
        </button>
        <button
          onClick={() => {
            setActiveTab('repository');
            setError(null);
          }}
          className={`px-6 py-4.5 text-base font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'repository'
              ? 'border-blue-600 dark:border-blue-500 text-zinc-950 dark:text-white bg-white dark:bg-zinc-900/10'
              : 'border-transparent text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          Repository analysis
        </button>
      </div>

      <div className="p-10 flex flex-col gap-10">
        
        {/* ========================== TAB 1: ANALYZE ========================== */}
        {activeTab === 'analyze' && (
          <>
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center animate-fadeIn">
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">Target filename</label>
                <input
                  id="filename-input"
                  type="text"
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4.5 py-3 text-base w-full md:w-72 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-800 dark:text-zinc-300"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </div>
              <button
                onClick={loadExample}
                className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-lg text-base font-semibold transition-all dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-800 cursor-pointer self-end md:self-auto"
              >
                Load Example
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">Source code</label>
              <textarea
                id="code-input"
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 text-base font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 min-h-[260px] text-zinc-800 dark:text-zinc-300"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste or write your source code here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-650 dark:text-zinc-450">
                <div>
                  <span className="text-zinc-500">Filename:</span> <span className="font-semibold text-zinc-750 dark:text-zinc-250">{filename || 'None'}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800"></div>
                <div>
                  <span className="text-zinc-500">Characters:</span> <span className="font-semibold text-zinc-750 dark:text-zinc-250">{code.length}</span>
                </div>
                {result && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800"></div>
                    <div>
                      <span className="text-zinc-550">Last analysis:</span>{' '}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {result.summary.total} {result.summary.total === 1 ? 'issue' : 'issues'} found
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4.5 justify-between sm:justify-end">
                {error && <span className="text-red-500 dark:text-red-400 text-sm font-semibold mr-2">{error}</span>}
                
                <button
                  id="analyze-btn"
                  disabled={loading || cleanLoading}
                  onClick={handleAnalyze}
                  className="px-7 py-3 bg-zinc-900 hover:bg-zinc-855 text-zinc-100 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-base transition-all shadow-md flex items-center gap-2.5 cursor-pointer"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>

                <button
                  id="clean-btn"
                  disabled={loading || cleanLoading}
                  onClick={handleClean}
                  className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-base transition-all shadow-md flex items-center gap-2.5 cursor-pointer"
                >
                  {cleanLoading ? 'Cleaning...' : 'Clean Code'}
                </button>
              </div>
            </div>

            {result && (
              <div className="flex flex-col gap-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Analysis summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-400 dark:bg-zinc-650"></div>
                      <div className="text-4xl font-extrabold tracking-tight text-zinc-855 dark:text-zinc-100">{result.summary.comments}</div>
                      <div className="text-sm font-medium text-zinc-500 mt-1.5">Comments</div>
                    </div>
                    <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                      <div className="text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">{result.summary.todos}</div>
                      <div className="text-sm font-medium text-zinc-500 mt-1.5">TODOs</div>
                    </div>
                    <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                      <div className="text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">{result.summary.fixmes}</div>
                      <div className="text-sm font-medium text-zinc-500 mt-1.5">FIXMEs</div>
                    </div>
                    <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                      <div className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">{result.summary.consoleLogs}</div>
                      <div className="text-sm font-medium text-zinc-500 mt-1.5">Logs</div>
                    </div>
                    <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center col-span-2 sm:col-span-1 relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                      <div className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{result.summary.total}</div>
                      <div className="text-sm font-medium text-zinc-500 mt-1.5">Total</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Scan results</h3>
                  {result.issues.length > 0 ? (
                    <div className="flex flex-col gap-2.5 max-h-[320px] overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-black/20">
                      {result.issues.map((issue, idx) => (
                        <IssueCard key={issue.id || idx} issue={issue} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 text-center text-zinc-500 text-sm">
                      No issues detected in the scanned content.
                    </div>
                  )}
                </div>

                <details className="group border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950/20">
                  <summary className="flex justify-between items-center px-4 py-3.5 cursor-pointer select-none font-semibold text-sm text-zinc-650 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                    <span>Raw JSON output</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyToClipboard();
                        }}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-xs font-semibold border border-zinc-200 hover:border-zinc-300 transition-all text-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800"
                      >
                        {copied ? 'Copied!' : 'Copy results'}
                      </button>
                      <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/40">
                    <pre id="result-panel" className="p-4 text-xs font-mono overflow-auto max-h-[300px] text-zinc-750 dark:text-zinc-300">
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
              <div className="flex flex-col gap-8 animate-fadeIn">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                    <div className="text-3xl font-extrabold tracking-tight text-zinc-750 dark:text-zinc-300">{formatBytes(cleanResult.summary.originalBytes)}</div>
                    <div className="text-sm font-medium text-zinc-500 mt-1.5">Original size</div>
                  </div>
                  <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                    <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{formatBytes(cleanResult.summary.cleanedBytes)}</div>
                    <div className="text-sm font-medium text-zinc-500 mt-1.5">Cleaned size</div>
                  </div>
                  <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                    <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">-{formatBytes(cleanResult.summary.bytesSaved)}</div>
                    <div className="text-sm font-medium text-zinc-500 mt-1.5">Bytes saved</div>
                  </div>
                  <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                    <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{cleanResult.summary.issuesRemoved}</div>
                    <div className="text-sm font-medium text-zinc-500 mt-1.5">Issues removed</div>
                  </div>
                  <div className="bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-center relative overflow-hidden shadow-sm">
                    <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{cleanResult.summary.percentReduction}%</div>
                    <div className="text-sm font-medium text-zinc-500 mt-1.5">Reduction %</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-base font-semibold text-zinc-650 dark:text-zinc-400 pl-1">Original code</label>
                    <pre className="text-sm font-mono text-zinc-650 dark:text-zinc-350 bg-zinc-100/60 dark:bg-black/30 border border-zinc-200 dark:border-zinc-800 p-5 rounded-lg overflow-auto max-h-[380px] whitespace-pre-wrap break-all min-h-[220px] leading-relaxed">
                      {cleanResult.originalCode}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <label className="text-base font-semibold text-zinc-650 dark:text-zinc-400 pl-1">Cleaned code</label>
                    <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-150/40 dark:bg-black/30 border border-emerald-500/20 p-5 rounded-lg overflow-auto max-h-[380px] whitespace-pre-wrap break-all min-h-[220px] leading-relaxed">
                      {cleanResult.cleanedCode || '/* File is empty after cleaning */'}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-zinc-150 hover:bg-zinc-200 text-zinc-850 border border-zinc-200 rounded-lg text-base font-semibold transition-all dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800 cursor-pointer"
                  >
                    Reset
                  </button>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={copyCleanedCode}
                      className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-855 border border-zinc-200 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-800 cursor-pointer"
                    >
                      {cleanCodeCopied ? 'Copied!' : 'Copy cleaned code'}
                    </button>
                    <button
                      onClick={downloadCleanedFile}
                      className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-855 border border-zinc-200 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-800 cursor-pointer"
                    >
                      Download cleaned file
                    </button>
                    <button
                      onClick={downloadReport}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Download report
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center text-zinc-500 text-sm">
                No cleaned content available yet. Enter code in the Analyze File tab, then click the Clean Code button.
              </div>
            )}
          </div>
        )}

        {/* ========================== TAB 3: REPOSITORY ========================== */}
        {activeTab === 'repository' && <RepositoryTab />}

      </div>
    </div>
  );
}

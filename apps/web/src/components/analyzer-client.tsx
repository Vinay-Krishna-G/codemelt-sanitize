'use client';

import React, { useState } from 'react';
import { AnalyzeResponse, CleanResponse } from '../types/sanitize';
import IssueCard from './issue-card';

export default function AnalyzerClient() {
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

  // Render Comparison Screen
  if (showComparison && cleanResult) {
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
          
          <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-750"></div>
            <div className="text-2xl font-bold tracking-tight text-zinc-400">{formatBytes(cleanResult.summary.originalBytes)}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Original Size</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="text-2xl font-bold tracking-tight text-emerald-400">{formatBytes(cleanResult.summary.cleanedBytes)}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Cleaned Size</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="text-2xl font-bold tracking-tight text-emerald-400">-{formatBytes(cleanResult.summary.bytesSaved)}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Bytes Saved</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="text-2xl font-bold tracking-tight text-emerald-400">{cleanResult.summary.issuesRemoved}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Issues Removed</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center col-span-2 sm:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
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

  // Render Standard Editor/Analyze View
  return (
    <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 flex flex-col gap-6" id="analyzer">
      
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
    </div>
  );
}

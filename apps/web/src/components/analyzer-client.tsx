'use client';

import React, { useState } from 'react';
import { AnalyzeResponse } from '../types/sanitize';
import IssueCard from './issue-card';

export default function AnalyzerClient() {
  const [filename, setFilename] = useState('input.js');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [copied, setCopied] = useState(false);

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

        {/* Scan Actions */}
        <div className="flex items-center gap-4 justify-between sm:justify-end">
          {error && <span className="text-red-400 text-sm font-medium">{error}</span>}
          <button
            id="analyze-btn"
            disabled={loading}
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
        </div>
      </div>

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
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-xs font-semibold border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-300 group-open:inline-block"
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

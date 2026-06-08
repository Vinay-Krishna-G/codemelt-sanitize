'use client';

import React, { useState } from 'react';
import { AnalyzeResponse } from '../types/sanitize';

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
    <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Target Filename</label>
          <input
            id="filename-input"
            type="text"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-zinc-500"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </div>
        <button
          onClick={loadExample}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
        >
          Load Example
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Source Code</label>
        <textarea
          id="code-input"
          className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-zinc-500 min-h-[220px]"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste or write your source code here..."
        />
      </div>

      <div className="flex justify-between items-center gap-4">
        {error && <span className="text-red-400 text-sm font-medium">{error}</span>}
        <div className="flex-1" />
        <button
          id="analyze-btn"
          disabled={loading}
          onClick={handleAnalyze}
          className="px-6 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors shadow-md"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {result && (
        <div className="flex flex-col gap-6 border-t border-zinc-800 pt-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Analysis Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800 text-center">
                <div className="text-2xl font-bold">{result.summary.comments}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Comments</div>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800 text-center">
                <div className="text-2xl font-bold text-amber-400">{result.summary.todos}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">TODOs</div>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800 text-center">
                <div className="text-2xl font-bold text-rose-400">{result.summary.fixmes}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">FIXMEs</div>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800 text-center">
                <div className="text-2xl font-bold text-blue-400">{result.summary.consoleLogs}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Console Logs</div>
              </div>
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-center col-span-2 sm:col-span-1">
                <div className="text-2xl font-bold">{result.summary.total}</div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Issues</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Scan Results</h3>
            {result.issues.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-auto border border-zinc-800 rounded-lg p-3 bg-black/20">
                {result.issues.map((issue, idx) => {
                  let typeLabel: string = issue.type;
                  let badgeColor = 'bg-zinc-800 text-zinc-400';
                  if (issue.type === 'comment') {
                    typeLabel = 'Comment';
                    badgeColor = 'bg-zinc-800/50 text-zinc-400 border border-zinc-800/30';
                  } else if (issue.type === 'todo') {
                    typeLabel = 'TODO';
                    badgeColor = 'bg-amber-900/30 text-amber-400 border border-amber-800/30';
                  } else if (issue.type === 'fixme') {
                    typeLabel = 'FIXME';
                    badgeColor = 'bg-rose-900/30 text-rose-400 border border-rose-800/30';
                  } else if (issue.type === 'console_log') {
                    typeLabel = 'Console Log';
                    badgeColor = 'bg-blue-900/30 text-blue-400 border border-blue-800/30';
                  }

                  return (
                    <div key={issue.id || idx} className="flex flex-col gap-1.5 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {typeLabel}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">Line {issue.line}</span>
                      </div>
                      <pre className="text-xs font-mono text-zinc-300 bg-black/30 p-2 rounded border border-zinc-800/50 overflow-x-auto whitespace-pre-wrap break-all">
                        {issue.rawContent.trim()}
                      </pre>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-black/20 border border-zinc-800 rounded-lg p-6 text-center text-zinc-500 text-sm">
                No issues detected in the scanned content.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Raw JSON Output</h3>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-semibold border border-zinc-700 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Results'}
              </button>
            </div>
            <pre
              id="result-panel"
              className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-xs font-mono overflow-auto max-h-[300px] text-zinc-300"
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

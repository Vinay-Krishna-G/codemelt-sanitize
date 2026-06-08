'use client';

import React, { useState } from 'react';
import type { RepositoryAnalysis } from '../../types/sanitize';
import { calculateHealthScore } from '../../lib/repository/health-score';

interface RepositoryHeaderProps {
  repoName: string;
  repoAnalysis: RepositoryAnalysis;
  skippedFilesCount: number;
  onReset: () => void;
}

export default function RepositoryHeader({
  repoName,
  repoAnalysis,
  skippedFilesCount,
  onReset
}: RepositoryHeaderProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerStub = (feature: string) => {
    setToastMessage(`${feature} is a Phase 5B feature and is not yet implemented.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Calculate severity issue counts
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

  // 2. Calculate Health Score
  const healthScore = calculateHealthScore(
    repoAnalysis.totalFiles,
    criticalCount,
    warningCount,
    infoCount
  );

  // 3. Determine health colors
  let healthColor = 'text-emerald-500';
  let healthBg = 'bg-emerald-500';
  let healthLabel = 'Healthy';
  if (healthScore < 70) {
    healthColor = 'text-rose-500';
    healthBg = 'bg-rose-500';
    healthLabel = 'Needs Attention';
  } else if (healthScore < 90) {
    healthColor = 'text-amber-500';
    healthBg = 'bg-amber-500';
    healthLabel = 'Warning';
  }

  // 4. Calculate top languages
  const extCounts: Record<string, number> = {};
  repoAnalysis.files.forEach((file) => {
    const dotIdx = file.path.lastIndexOf('.');
    const ext = dotIdx !== -1 ? file.path.substring(dotIdx).toLowerCase() : 'other';
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  });

  const totalScanned = repoAnalysis.files.length || 1;
  const topLanguages = Object.entries(extCounts)
    .map(([ext, count]) => {
      let langName = ext.toUpperCase().replace('.', '');
      if (ext === '.js') langName = 'JavaScript';
      else if (ext === '.ts') langName = 'TypeScript';
      else if (ext === '.jsx') langName = 'JSX';
      else if (ext === '.tsx') langName = 'TSX';
      else if (ext === '.py') langName = 'Python';
      else if (ext === '.go') langName = 'Go';
      else if (ext === '.rb') langName = 'Ruby';
      else if (ext === '.rs') langName = 'Rust';
      else if (ext === '.cpp') langName = 'C++';
      else if (ext === '.c') langName = 'C';
      else if (ext === '.h') langName = 'Header';
      else if (ext === '.cs') langName = 'C#';
      else if (ext === '.sh') langName = 'Shell';
      else if (ext === '.php') langName = 'PHP';
      else if (ext === '.css') langName = 'CSS';
      else if (ext === '.html') langName = 'HTML';
      return { name: langName, percentage: Math.round((count / totalScanned) * 100), count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const displayBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="flex flex-col gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6 relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs px-4 py-2 rounded-full shadow-lg border border-zinc-700 dark:border-zinc-300 transition-all duration-300 z-50 flex items-center gap-1.5 animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
          </span>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide">
              {repoName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-400 mt-1 font-semibold">
              <span>Files: {repoAnalysis.totalFiles} analyzed</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800"></span>
              <span>Skipped: {skippedFilesCount} files</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800"></span>
              <span>Size: {displayBytes(repoAnalysis.totalBytes)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => triggerStub('Batch Clean')}
            className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-9-5.25h12M3.75 6.75h16.5" />
            </svg>
            Clean Repository
          </button>
          <button
            onClick={() => triggerStub('Export Cleaned ZIP')}
            className="px-4.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-800 dark:text-zinc-200 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export ZIP
          </button>
          <button
            onClick={() => triggerStub('Generate Report')}
            className="px-4.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-800 dark:text-zinc-200 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Generate Report
          </button>
          <button
            onClick={onReset}
            className="px-4.5 py-2.5 bg-zinc-100 hover:bg-zinc-250 border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-350 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Metrics Row & Health Score (Numeric + Progress Bar) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Health Score Panel (Col 1-4) */}
        <div className="col-span-1 md:col-span-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Repository Health</span>
            <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${healthColor}`}>
              {healthLabel}
            </span>
          </div>
          
          <div className="flex items-baseline gap-1 my-3">
            <span className="text-4xl font-black text-zinc-850 dark:text-white">{healthScore}</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-base font-bold">/100</span>
          </div>

          <div className="w-full">
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${healthBg} transition-all duration-500 rounded-full`}
                style={{ width: `${healthScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Severity Issue Breakdown (Col 5-8) */}
        <div className="col-span-1 md:col-span-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Issue Severity Breakdown</span>
          
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="flex flex-col items-center p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
              <span className="text-lg font-black text-red-500">{criticalCount}</span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-0.5">Critical</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
              <span className="text-lg font-black text-amber-500">{warningCount}</span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-0.5">Warning</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
              <span className="text-lg font-black text-blue-500">{infoCount}</span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-0.5">Info</span>
            </div>
          </div>
        </div>

        {/* Top Languages Panel (Col 9-12) */}
        <div className="col-span-1 md:col-span-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Top Languages</span>
          
          <div className="flex flex-col gap-2 mt-3.5">
            {topLanguages.map((lang, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-750 dark:text-zinc-350">{lang.name}</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="h-1.5 bg-zinc-200 dark:bg-zinc-850 rounded-full flex-1 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lang.percentage}%` }}></div>
                  </div>
                </div>
                <span className="font-bold text-zinc-500 w-8 text-right">{lang.percentage}%</span>
              </div>
            ))}
            {topLanguages.length === 0 && (
              <div className="text-xs text-zinc-400 italic text-center py-4">No code files detected</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

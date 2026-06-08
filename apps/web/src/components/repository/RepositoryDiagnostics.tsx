'use client';

import React from 'react';

interface SkippedFile {
  path: string;
  reason: string;
}

interface RepositoryDiagnosticsProps {
  skippedStats: {
    directories: number;
    extensions: number;
    oversized: number;
  };
  skippedFiles: SkippedFile[];
  onReset: () => void;
}

export default function RepositoryDiagnostics({
  skippedStats,
  skippedFiles,
  onReset
}: RepositoryDiagnosticsProps) {
  return (
    <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-500/20 rounded-xl p-8 flex flex-col gap-6 animate-fadeIn" id="diagnostics-panel">
      <div className="flex items-start gap-4">
        <span className="p-3 bg-amber-100/80 dark:bg-amber-500/10 rounded-lg text-amber-700 dark:text-amber-400 mt-0.5 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-amber-800 dark:text-amber-400 text-lg">No supported code files found</h3>
          <p className="text-base text-zinc-650 dark:text-zinc-400 leading-relaxed">
            The folder was scanned, but no candidate source files were available. Ignored file counts by type:
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-250/60 dark:border-zinc-850 pt-5">
        <div className="bg-zinc-100/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-5 rounded-xl text-center shadow-sm">
          <div className="text-3xl font-extrabold text-zinc-850 dark:text-zinc-150">{skippedStats.directories}</div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 mt-1.5">Excluded folder items</div>
        </div>
        <div className="bg-zinc-100/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-5 rounded-xl text-center shadow-sm">
          <div className="text-3xl font-extrabold text-zinc-850 dark:text-zinc-150">{skippedStats.extensions}</div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 mt-1.5">Unsupported extension files</div>
        </div>
        <div className="bg-zinc-100/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-5 rounded-xl text-center shadow-sm">
          <div className="text-3xl font-extrabold text-zinc-850 dark:text-zinc-150">{skippedStats.oversized}</div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 mt-1.5">Oversized files (&gt;500 KB)</div>
        </div>
      </div>

      <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-1 flex flex-col gap-2">
        <span className="font-bold text-zinc-800 dark:text-zinc-300">Diagnostic recommendations:</span>
        <ul className="list-disc pl-5 flex flex-col gap-1.5 text-zinc-650 dark:text-zinc-450">
          <li>Ensure the repository contains supported source files (such as `.js`, `.ts`, `.py`, `.go`, `.cpp`, `.css`, `.html`, `.json`, `.md`, `.yml`, `.yaml`).</li>
          <li>Verify you did not select folders containing only third-party builds or packages.</li>
          <li>Ensure code file size is below the safety threshold of 500 KB per file.</li>
        </ul>
      </div>

      {skippedFiles.length > 0 && (
        <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-lg overflow-hidden bg-white dark:bg-black/10">
          <summary className="flex justify-between items-center px-4 py-3 cursor-pointer select-none font-semibold text-sm text-zinc-650 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            <span>View all skipped files ({skippedFiles.length})</span>
            <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 max-h-48 overflow-y-auto p-4 flex flex-col gap-2">
            {skippedFiles.map((file, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono text-zinc-650 dark:text-zinc-400">
                <span className="truncate max-w-[70%]" title={file.path}>{file.path}</span>
                <span className="text-zinc-450 dark:text-zinc-500 font-sans font-semibold">{file.reason}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="flex justify-end border-t border-zinc-200 dark:border-zinc-800/60 pt-5 mt-2">
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-100 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-sm"
        >
          Reset Workspace
        </button>
      </div>
    </div>
  );
}

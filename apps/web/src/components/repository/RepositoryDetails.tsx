'use client';

import React, { useState } from 'react';
import type { RepositoryFile } from '../../types/sanitize';
import IssueCard from '../issue-card';
import { computeLineDiff } from '../../lib/repository/diff';

interface RepositoryDetailsProps {
  file: RepositoryFile;
  onCleanFile: (path: string) => Promise<void>;
  onRevertFile: (path: string) => void;
}

export default function RepositoryDetails({
  file,
  onCleanFile,
  onRevertFile
}: RepositoryDetailsProps) {
  const [cleaning, setCleaning] = useState(false);

  const handleClean = async () => {
    setCleaning(true);
    try {
      await onCleanFile(file.path);
    } catch (err) {
      console.error('Failed to clean file:', err);
    } finally {
      setCleaning(false);
    }
  };

  const displayBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const downloadCleanedFile = () => {
    if (!file.cleanedContent) return;
    const blob = new Blob([file.cleanedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = file.path.split('/').pop() || 'cleaned-file';
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isCleaned = file.cleanedContent !== undefined;
  
  // Compute aligned diff lines if cleaned
  const { left, right } = isCleaned 
    ? computeLineDiff(file.content, file.cleanedContent || '') 
    : { left: [], right: [] };

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* File selected title bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-100/50 dark:bg-zinc-950/40 p-4.5 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm">
        <div className="flex flex-col gap-1.5 max-w-[280px] sm:max-w-[380px]">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">File Selected</span>
          <span className="text-sm text-zinc-800 dark:text-zinc-200 font-mono font-bold truncate" title={file.path}>
            {file.path}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 px-2.5 py-1.5 rounded shadow-sm">
            Size: {displayBytes(file.originalBytes)}
          </span>
          <span className={`px-2.5 py-1.5 rounded border shadow-sm ${
            file.issueCount > 0 
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400' 
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
          }`}>
            {file.issueCount} {file.issueCount === 1 ? 'issue' : 'issues'}
          </span>
          
          {!isCleaned ? (
            <button
              onClick={handleClean}
              disabled={cleaning}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {cleaning ? (
                <span>Cleaning...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                  Clean File
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={downloadCleanedFile}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow-sm transition-all text-xs font-bold cursor-pointer"
              >
                Download Cleaned
              </button>
              <button
                onClick={() => onRevertFile(file.path)}
                className="bg-zinc-200 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 shadow-sm transition-all text-xs font-bold cursor-pointer"
              >
                Revert
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Renders side-by-side comparison if cleaned */}
      {isCleaned ? (
        <div className="flex flex-col gap-5 animate-fadeIn">
          
          {/* Cleaning Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/25 p-4 rounded-xl shadow-sm">
            <div className="text-center">
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Original Size</div>
              <div className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300 mt-1">{displayBytes(file.originalBytes)}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Cleaned Size</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{displayBytes(file.cleanedBytes || 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Bytes Saved</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">-{displayBytes(file.originalBytes - (file.cleanedBytes || 0))}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Status</div>
              <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-block mt-1 uppercase tracking-wide">
                Sanitized
              </div>
            </div>
          </div>

          {/* Side-by-Side code block */}
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-zinc-450 dark:text-zinc-500 pl-1 uppercase tracking-wide">Original Code</label>
              <div className="text-xs font-mono bg-zinc-100/60 dark:bg-black/30 border border-zinc-200 dark:border-zinc-850 rounded-lg overflow-auto max-h-[300px] min-h-[180px] p-2 flex flex-col font-medium leading-relaxed select-text">
                {left.map((line, idx) => (
                  <div key={`left-${idx}`} className={`flex w-full items-start px-2 ${line.type === 'removed' ? 'bg-red-500/15 text-red-700 dark:text-red-400 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    <span className="w-8 text-right select-none opacity-45 mr-3 text-[10px] pr-1.5 border-r border-zinc-300 dark:border-zinc-800">{line.lineNumber}</span>
                    <span className="flex-1 whitespace-pre break-all">{line.content || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 pl-1 uppercase tracking-wide">Cleaned Code</label>
              <div className="text-xs font-mono bg-zinc-150/40 dark:bg-black/30 border border-emerald-500/20 rounded-lg overflow-auto max-h-[300px] min-h-[180px] p-2 flex flex-col font-medium leading-relaxed select-text">
                {right.map((line, idx) => (
                  <div key={`right-${idx}`} className={`flex w-full items-start px-2 ${line.type === 'removed' ? 'bg-red-500/5 dark:bg-red-950/10 h-[1.375rem]' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    <span className="w-8 text-right select-none opacity-45 mr-3 text-[10px] pr-1.5 border-r border-zinc-300 dark:border-zinc-800">
                      {line.lineNumber !== undefined ? line.lineNumber : ' '}
                    </span>
                    <span className="flex-1 whitespace-pre break-all">{line.content || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <>
          {/* List of issues for selected file */}
          {file.issueCount > 0 ? (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-450">Scan Details</h4>
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-3 bg-zinc-50 dark:bg-black/20">
                {file.issues.map((issue, idx) => (
                  <IssueCard key={issue.id || idx} issue={issue} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-black/10 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 text-center text-zinc-500 text-sm font-semibold">
              No issues detected in this file.
            </div>
          )}

          {/* Raw code preview of original */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-450">Source Code Preview</h4>
            <pre className="text-xs font-mono text-zinc-650 dark:text-zinc-350 bg-zinc-100/60 dark:bg-black/30 border border-zinc-200 dark:border-zinc-850 p-4.5 rounded-lg overflow-auto max-h-[250px] whitespace-pre-wrap break-all leading-relaxed">
              {file.content || '/* Empty File */'}
            </pre>
          </div>
        </>
      )}

    </div>
  );
}

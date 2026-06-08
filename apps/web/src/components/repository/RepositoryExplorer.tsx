'use client';

import React from 'react';
import type { RepositoryFile } from '../../types/sanitize';
import { getFileIcon } from '../../lib/repository/file-icons';
import { getIssueSeverity } from '../../lib/repository/severity';
import { filterFiles, getTopProblemFiles } from '../../lib/repository/repository-filters';

interface RepositoryExplorerProps {
  files: RepositoryFile[];
  selectedFilePath: string | null;
  setSelectedFilePath: (path: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function RepositoryExplorer({
  files,
  selectedFilePath,
  setSelectedFilePath,
  searchQuery,
  setSearchQuery
}: RepositoryExplorerProps) {
  
  // Filtered files list
  const filteredFiles = filterFiles(files, searchQuery);

  // Top 5 problem files
  const topProblemFiles = getTopProblemFiles(files, 5);

  // Determine highest severity style for badges in the list
  const getHighestSeverityStyle = (file: RepositoryFile) => {
    let highest: 'critical' | 'warning' | 'info' | null = null;
    for (const issue of file.issues) {
      const sev = getIssueSeverity(issue.type);
      if (sev === 'critical') {
        highest = 'critical';
        break; // Critical is the max priority, we can stop
      } else if (sev === 'warning') {
        highest = 'warning';
      } else if (sev === 'info' && highest === null) {
        highest = 'info';
      }
    }

    if (highest === 'critical') {
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25';
    } else if (highest === 'warning') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25';
    } else if (highest === 'info') {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25';
    }
    return 'bg-zinc-150 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-750';
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      
      {/* Top Problem Files Panel */}
      {topProblemFiles.length > 0 && (
        <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 p-4.5 rounded-xl flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-4 h-4 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span className="text-xs font-extrabold uppercase tracking-wider">Top Problem Files</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {topProblemFiles.map((file) => {
              const isSelected = selectedFilePath === file.path;
              const severityClass = getHighestSeverityStyle(file);
              return (
                <button
                  key={`problem-${file.path}`}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full flex items-center justify-between p-2.5 rounded text-left transition-all text-xs font-semibold cursor-pointer border ${
                    isSelected
                      ? 'bg-zinc-200/80 border-zinc-350 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-950 dark:text-white'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350'
                  }`}
                >
                  <span className="truncate max-w-[150px] font-mono" title={file.path}>
                    {file.path.split('/').pop()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityClass}`}>
                    {file.issueCount} {file.issueCount === 1 ? 'issue' : 'issues'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter files..."
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm w-full focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.2"
            stroke="currentColor"
            className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
          </svg>
        </div>

        {/* Scrollable Explorer List */}
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[380px] pr-1.5 border border-zinc-200/60 dark:border-zinc-850/80 rounded-lg p-1.5 bg-zinc-50/50 dark:bg-zinc-950/20">
          {filteredFiles.map((file) => {
            const isSelected = selectedFilePath === file.path;
            const filename = file.path.split('/').pop() || file.path;
            const badgeClass = getHighestSeverityStyle(file);
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full flex items-center justify-between p-2.5 rounded text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-zinc-200/80 border-zinc-300 dark:bg-zinc-850 dark:border-zinc-750 text-zinc-950 dark:text-white font-semibold'
                    : 'bg-transparent border-transparent hover:bg-zinc-150/60 dark:hover:bg-zinc-900/50 text-zinc-650 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(file.path)}
                  <span className="text-xs font-mono truncate max-w-[130px]" title={file.path}>
                    {filename}
                  </span>
                </div>
                {file.issueCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                    {file.issueCount}
                  </span>
                )}
              </button>
            );
          })}
          {filteredFiles.length === 0 && (
            <div className="text-xs text-zinc-400 italic p-6 text-center">
              No matching files found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

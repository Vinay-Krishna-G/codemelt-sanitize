import React from 'react';
import type { RepositoryIntelligence } from '../../types/intelligence';

interface RepositoryOverviewCardProps {
  intelligence: RepositoryIntelligence;
  healthScore: number;
}

export default function RepositoryOverviewCard({
  intelligence,
  healthScore
}: RepositoryOverviewCardProps) {
  const displayBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        Repository Snapshot
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Primary Stack Type</span>
          <span className="text-lg font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
            {intelligence.primaryType}
            {intelligence.detectedTechnologies.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {Math.round(intelligence.detectedTechnologies[0].confidence)}%
              </span>
            )}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Primary Purpose</span>
          <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1.5" title={intelligence.repositoryPurpose.reason}>
            {intelligence.repositoryPurpose.purpose}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {intelligence.repositoryPurpose.confidence}%
            </span>
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate" title={intelligence.repositoryPurpose.reason}>
            {intelligence.repositoryPurpose.reason}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Total Files / Directories</span>
          <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200">
            {intelligence.repositoryStats.totalFiles} files / {intelligence.repositoryStats.totalDirectories} dirs
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Repository Size</span>
          <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200">
            {displayBytes(intelligence.repositoryStats.totalBytes)}
          </span>
        </div>

        <div className="flex flex-col gap-1 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Health Score</span>
          <span className="text-lg font-black text-emerald-500">
            {healthScore} <span className="text-xs font-bold text-zinc-400">/100</span>
          </span>
        </div>

        <div className="flex flex-col gap-1 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Package Manager</span>
          <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 uppercase">
            {intelligence.packageManager}
          </span>
        </div>

        <div className="flex flex-col gap-1 border-t border-zinc-100 dark:border-zinc-800/50 pt-4 col-span-2">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Repository Version</span>
          <span className="text-base font-bold text-zinc-700 dark:text-zinc-300 font-mono">
            v{intelligence.repositoryFingerprint.repositoryVersion}{' '}
            <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-normal">
              (extracted from {intelligence.repositoryFingerprint.versionSource})
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import type { RepositoryIntelligence } from '../../types/intelligence';

interface RepositoryStructureCardProps {
  intelligence: RepositoryIntelligence;
}

export default function RepositoryStructureCard({ intelligence }: RepositoryStructureCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-555 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        Workspace Structure
      </h3>
      
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Core Directories</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {intelligence.coreDirectories.map((dir, idx) => (
              <span key={idx} className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-250 px-2 py-1 rounded border border-zinc-200/50 dark:border-zinc-700/50">
                {dir}/
              </span>
            ))}
            {intelligence.coreDirectories.length === 0 && (
              <span className="text-xs italic text-zinc-400">None detected</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
            Workspace Packages ({intelligence.packageFolders.length})
          </span>
          <div className="flex flex-col gap-1 mt-2 max-h-[140px] overflow-y-auto pr-1 font-mono text-xs">
            {intelligence.packageFolders.map((folder, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 px-2 py-1.5 rounded flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                <span>{folder}/</span>
              </div>
            ))}
            {intelligence.packageFolders.length === 0 && (
              <span className="text-xs italic text-zinc-400 mt-1">No monorepo package folders discovered</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

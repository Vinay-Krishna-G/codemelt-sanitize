import React from 'react';
import type { RepositoryIntelligence } from '../../types/intelligence';

interface EntryPointsCardProps {
  intelligence: RepositoryIntelligence;
}

export default function EntryPointsCard({ intelligence }: EntryPointsCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-555 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        Discovered Entry Points ({intelligence.entryPoints.length})
      </h3>
      <ul className="flex flex-col gap-1.5 overflow-y-auto max-h-[300px] pr-1">
        {intelligence.entryPoints.map((ep, idx) => (
          <li key={idx} className="flex flex-col gap-1 bg-zinc-50 dark:bg-zinc-950/40 p-2.5 rounded border border-zinc-150 dark:border-zinc-850">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 break-all">{ep.path}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600/10 text-blue-600 dark:text-blue-400">
                Priority {ep.priority}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{ep.type}</span>
          </li>
        ))}
        {intelligence.entryPoints.length === 0 && (
          <span className="text-xs italic text-zinc-400 py-12 text-center">No entry points detected in this project</span>
        )}
      </ul>
    </div>
  );
}

import React from 'react';
import type { RepositoryIntelligence } from '../../types/intelligence';

interface TechnologyStackCardProps {
  intelligence: RepositoryIntelligence;
}

export default function TechnologyStackCard({ intelligence }: TechnologyStackCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-555 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        Technology Stack & Frameworks
      </h3>
      
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Detected Technologies</span>
          <div className="flex flex-col gap-1.5 mt-2">
            {intelligence.detectedTechnologies.map((tech, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded border border-zinc-150 dark:border-zinc-850">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{tech.type}</span>
                <div className="flex gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {tech.confidence}%
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    tech.confidenceLevel === 'high' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' :
                    tech.confidenceLevel === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450' :
                    'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {tech.confidenceLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Frameworks / Tooling</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {intelligence.frameworks.map((fw, idx) => (
              <span key={idx} className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded border border-zinc-200/50 dark:border-zinc-700/50 flex items-center gap-1.5">
                {fw.name}
                <span className="text-[10px] opacity-75">({fw.confidence}%)</span>
              </span>
            ))}
            {intelligence.frameworks.length === 0 && (
              <span className="text-xs italic text-zinc-400">None detected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

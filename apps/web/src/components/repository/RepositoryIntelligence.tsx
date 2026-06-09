'use client';

import React from 'react';
import type { RepositoryIntelligence as IntelligenceType } from '../../types/intelligence';
import RepositoryOverviewCard from './RepositoryOverviewCard';
import RepositoryStructureCard from './RepositoryStructureCard';
import TechnologyStackCard from './TechnologyStackCard';
import EntryPointsCard from './EntryPointsCard';
import AIContextExportPanel from './AIContextExportPanel';

interface RepositoryIntelligenceProps {
  intelligence: IntelligenceType;
  healthScore: number;
}

export default function RepositoryIntelligence({
  intelligence,
  healthScore
}: RepositoryIntelligenceProps) {
  const displayBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn text-zinc-850 dark:text-zinc-350">
      
      {/* Warnings Banner Card */}
      {intelligence.analysisWarnings.length > 0 && (
        <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 shadow-sm flex gap-3.5 animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div className="flex flex-col gap-1.5 flex-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Analysis Diagnostics Warnings</h4>
            <ul className="list-disc pl-5 text-xs text-amber-700 dark:text-amber-400/80 space-y-1">
              {intelligence.analysisWarnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Snapshot Overview */}
      <RepositoryOverviewCard intelligence={intelligence} healthScore={healthScore} />

      {/* Structural Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TechnologyStackCard intelligence={intelligence} />
        <RepositoryStructureCard intelligence={intelligence} />
      </div>

      {/* Entry Points & Languages Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <EntryPointsCard intelligence={intelligence} />

        {/* Language Breakdown Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-555 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Language Breakdown
          </h3>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
            {intelligence.languageBreakdown.map((lang, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-700 dark:text-zinc-300 font-bold">{lang.language}</span>
                  <span className="text-zinc-400 font-medium">{lang.percentage}% ({displayBytes(lang.bytes)})</span>
                </div>
                
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-850">
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${lang.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {intelligence.languageBreakdown.length === 0 && (
              <div className="text-xs italic text-zinc-400 text-center py-12">No files counted</div>
            )}
          </div>
        </div>
      </div>

      {/* Split Dependencies Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md flex flex-col animate-fadeIn">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-555 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Key Runtime Dependencies ({intelligence.productionDependencies.length})
          </h3>
          <ul className="flex flex-col gap-1.5 overflow-y-auto max-h-[200px] pr-1">
            {intelligence.productionDependencies.map((dep, idx) => (
              <li key={idx} className="flex items-center justify-between text-xs font-mono bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded border border-zinc-150 dark:border-zinc-850">
                <span className="text-zinc-700 dark:text-zinc-300 font-bold">{dep.name}</span>
                <span className="text-zinc-400 font-medium">{dep.version}</span>
              </li>
            ))}
            {intelligence.productionDependencies.length === 0 && (
              <span className="text-xs italic text-zinc-400 py-6 text-center">No runtime dependencies listed</span>
            )}
          </ul>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md flex flex-col animate-fadeIn">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-555 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Key Development Dependencies ({intelligence.developmentDependencies.length})
          </h3>
          <ul className="flex flex-col gap-1.5 overflow-y-auto max-h-[200px] pr-1">
            {intelligence.developmentDependencies.map((dep, idx) => (
              <li key={idx} className="flex items-center justify-between text-xs font-mono bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded border border-zinc-150 dark:border-zinc-850">
                <span className="text-zinc-700 dark:text-zinc-300 font-bold">{dep.name}</span>
                <span className="text-zinc-400 font-medium">{dep.version}</span>
              </li>
            ))}
            {intelligence.developmentDependencies.length === 0 && (
              <span className="text-xs italic text-zinc-400 py-6 text-center">No tooling dependencies listed</span>
            )}
          </ul>
        </div>
      </div>

      {/* AI Context Export System Panel */}
      <AIContextExportPanel intelligence={intelligence} />

    </div>
  );
}

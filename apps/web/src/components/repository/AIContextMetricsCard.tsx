import React from 'react';
import type { AIContextMetrics } from '../../types/intelligence';

interface AIContextMetricsCardProps {
  metrics: AIContextMetrics;
}

export default function AIContextMetricsCard({ metrics }: AIContextMetricsCardProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-555 pb-1 border-b border-zinc-200/50 dark:border-zinc-850">
        AI Prompt Metrics
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Prompt Readiness</span>
          <span className="text-base font-black text-blue-600 dark:text-blue-400">
            {metrics.promptReadiness}%
          </span>
        </div>
        
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Estimated Tokens</span>
          <span className="text-base font-black text-amber-500">
            {metrics.estimatedTokens}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Completeness</span>
          <span className="text-base font-black text-emerald-500">
            {metrics.completeness}%
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Prompt Quality</span>
          <span className="text-base font-black text-purple-500">
            {metrics.promptQuality}%
          </span>
        </div>

        <div className="flex flex-col gap-0.5 col-span-2 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-2">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Compression Ratio</span>
          <span className="text-base font-black text-rose-500 dark:text-rose-400">
            {metrics.compressionRatio}x <span className="text-[10px] font-normal text-zinc-450">smaller</span>
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { Issue } from 'codemelt-sanitize-core';

export interface IssueCardProps {
  issue: Issue;
}

interface ThemeConfig {
  label: string;
  badgeClass: string;
  cardClass: string;
  icon: React.ReactNode;
}

const ISSUE_THEME_MAP: Record<string, ThemeConfig> = {
  comment: {
    label: 'Comment',
    badgeClass: 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50',
    cardClass: 'hover:border-zinc-500/50',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )
  },
  todo: {
    label: 'TODO',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    cardClass: 'hover:border-amber-500/50',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="m9 12 2 2 4-4"/></svg>
    )
  },
  fixme: {
    label: 'FIXME',
    badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    cardClass: 'hover:border-rose-500/50',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-4 h-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    )
  },
  console_log: {
    label: 'Console Log',
    badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    cardClass: 'hover:border-blue-500/50',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-4 h-4"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
    )
  },
  default: {
    label: 'Issue',
    badgeClass: 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50',
    cardClass: 'hover:border-zinc-500/50',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    )
  }
};

export default function IssueCard({ issue }: IssueCardProps) {
  const theme = ISSUE_THEME_MAP[issue.type] || ISSUE_THEME_MAP.default;

  return (
    <div className={`flex flex-col gap-1.5 p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg transition-all duration-200 ${theme.cardClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">{theme.icon}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${theme.badgeClass}`}>
            {theme.label}
          </span>
        </div>
        <span className="text-xs text-zinc-500 font-medium">Line {issue.line}</span>
      </div>
      <pre className="text-xs font-mono text-zinc-300 bg-black/30 p-2.5 rounded border border-zinc-800/50 overflow-x-auto whitespace-pre-wrap break-all">
        {issue.rawContent.trim()}
      </pre>
    </div>
  );
}

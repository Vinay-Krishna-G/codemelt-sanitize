'use client';

import React from 'react';
import type { Issue } from 'codemelt-sanitize-core';
import { getIssueSeverity, SeverityLevel } from '../lib/repository/severity';

export interface IssueCardProps {
  issue: Issue;
}

interface ThemeConfig {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
}

const ISSUE_THEME_MAP: Record<string, ThemeConfig> = {
  comment: {
    label: 'Comment',
    badgeClass: 'bg-zinc-150 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-750',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )
  },
  todo: {
    label: 'TODO',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="m9 12 2 2 4-4"/></svg>
    )
  },
  fixme: {
    label: 'FIXME',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    )
  },
  console_log: {
    label: 'Console Log',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
    )
  },
  default: {
    label: 'Issue',
    badgeClass: 'bg-zinc-150 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-750',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    )
  }
};

const SEVERITY_THEME_MAP: Record<SeverityLevel, { label: string; badge: string; cardBorder: string }> = {
  critical: {
    label: 'Critical',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25',
    cardBorder: 'border-red-500/30 hover:border-red-500/60 dark:border-red-950 dark:hover:border-red-900 bg-red-500/5 dark:bg-red-950/10'
  },
  warning: {
    label: 'Warning',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
    cardBorder: 'border-amber-500/30 hover:border-amber-500/60 dark:border-amber-950 dark:hover:border-amber-900 bg-amber-500/5 dark:bg-amber-950/10'
  },
  info: {
    label: 'Informational',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25',
    cardBorder: 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/10'
  }
};

export default function IssueCard({ issue }: IssueCardProps) {
  const typeTheme = ISSUE_THEME_MAP[issue.type] || ISSUE_THEME_MAP.default;
  const severity = getIssueSeverity(issue.type);
  const severityTheme = SEVERITY_THEME_MAP[severity];

  return (
    <div className={`flex flex-col gap-2 p-3.5 border rounded-lg transition-all duration-200 ${severityTheme.cardBorder}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-450 dark:text-zinc-550">{typeTheme.icon}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeTheme.badgeClass}`}>
            {typeTheme.label}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${severityTheme.badge}`}>
            {severityTheme.label}
          </span>
        </div>
        <span className="text-xs text-zinc-500 font-semibold bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
          Line {issue.line}
        </span>
      </div>
      <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-350 bg-white/60 dark:bg-black/35 p-2.5 rounded border border-zinc-200/60 dark:border-zinc-850/60 overflow-x-auto whitespace-pre-wrap break-all">
        {issue.rawContent.trim()}
      </pre>
    </div>
  );
}

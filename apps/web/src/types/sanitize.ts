import type { Issue } from 'codemelt-sanitize-core';

export interface AnalyzeResponse {
  version: string;
  success: boolean;
  filename: string;
  summary: {
    comments: number;
    todos: number;
    fixmes: number;
    consoleLogs: number;
    total: number;
  };
  issues: Issue[];
  error?: string;
}

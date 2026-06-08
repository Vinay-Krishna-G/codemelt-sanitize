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

export interface CleanResponse {
  version: string;
  success: boolean;
  filename: string;
  originalCode: string;
  cleanedCode: string;
  summary: {
    originalBytes: number;
    cleanedBytes: number;
    bytesSaved: number;
    originalIssuesCount: number;
    cleanedIssuesCount: number;
    issuesRemoved: number;
    percentReduction: number;
  };
  error?: string;
}

export interface RepositoryFile {
  path: string;
  content: string;
  cleanedContent?: string;
  issues: Issue[];
  issueCount: number;
  originalBytes: number;
  cleanedBytes?: number;
}

export interface RepositoryAnalysis {
  files: RepositoryFile[];
  totalFiles: number;
  totalIssues: number;
  totalBytes: number;
  totalBytesSaved: number;
  totalComments: number;
  totalTodos: number;
  totalFixmes: number;
  totalConsoleLogs: number;
}


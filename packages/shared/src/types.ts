export type NoiseType = 'comment' | 'todo' | 'fixme' | 'console_log';

export interface Location {
  line: number;
  column: number;
}

export interface Issue {
  id: string;
  type: NoiseType;
  message: string;
  filePath: string;
  line: number;
  rawContent: string;
}

export interface CleanConfig {
  detectComments: boolean;
  detectTodos: boolean;
  detectFixmes: boolean;
  detectConsoleLogs: boolean;
  exclude: string[];
}

export interface FileScanResult {
  filePath: string;
  issues: Issue[];
  isCleaned: boolean;
  originalSize: number;
  cleanedSize?: number;
}

export interface ScanResult {
  summary: {
    totalFiles: number;
    scannedFiles: number;
    totalIssues: number;
    issuesByType: Record<NoiseType, number>;
    durationMs: number;
  };
  files: FileScanResult[];
}

export interface CleanResult extends ScanResult {
  summary: ScanResult['summary'] & {
    cleanedFiles: number;
    bytesSaved: number;
  };
}

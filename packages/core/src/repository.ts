import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  SUPPORTED_EXTENSIONS,
  DEFAULT_EXCLUDES,
  Issue,
  CleanConfig
} from 'codemelt-sanitize-shared';
import { scanContent } from './scanner.js';
import { cleanContent } from './cleaner.js';

export interface ScanRepositoryOptions {
  root: string;
  recursive?: boolean;
  exclude?: string[];
  detectComments?: boolean;
  detectTodos?: boolean;
  detectFixmes?: boolean;
  detectConsoleLogs?: boolean;
}

export interface ScanRepositoryResult {
  filesScanned: string[];
  filesSkipped: string[];
  totalIssues: number;
  issues: Issue[];
  errors: { filePath: string; error: string }[];
}

export interface BackupOptions {
  enabled: boolean;
  dir?: string;
}

export interface CleanRepositoryOptions extends ScanRepositoryOptions {
  dryRun?: boolean;
  backup?: BackupOptions;
}

export interface CleanRepositoryResult extends ScanRepositoryResult {
  filesCleaned: string[];
  bytesSaved: number;
}

function matchesPattern(filePath: string, root: string, pattern: string): boolean {
  const relativePath = path.relative(root, filePath);
  
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`(^|/)${regexPattern}($|/)`);
  return regex.test(relativePath) || regex.test(filePath);
}

function isIgnored(filePath: string, root: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    if (matchesPattern(filePath, root, pattern)) {
      return true;
    }
  }
  return false;
}

async function collectFiles(
  dir: string,
  root: string,
  excludePatterns: string[],
  recursive: boolean,
  filesList: string[],
  skippedList: string[]
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (isIgnored(fullPath, root, excludePatterns)) {
      skippedList.push(fullPath);
      continue;
    }

    if (entry.isDirectory()) {
      if (recursive) {
        await collectFiles(fullPath, root, excludePatterns, recursive, filesList, skippedList);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        filesList.push(fullPath);
      } else {
        skippedList.push(fullPath);
      }
    }
  }
}

async function loadIgnoreFile(root: string): Promise<string[]> {
  const ignoreFilePath = path.join(root, '.codemelt-sanitize-ignore');
  try {
    const content = await fs.readFile(ignoreFilePath, 'utf-8');
    return content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch {
    return [];
  }
}

export async function scanRepository(options: ScanRepositoryOptions): Promise<ScanRepositoryResult> {
  const root = path.resolve(options.root);
  const recursive = options.recursive ?? true;

  const fileIgnores = await loadIgnoreFile(root);
  const excludePatterns = [
    ...DEFAULT_EXCLUDES,
    ...(options.exclude ?? []),
    ...fileIgnores
  ];

  const filesList: string[] = [];
  const skippedList: string[] = [];
  const errors: { filePath: string; error: string }[] = [];

  try {
    await collectFiles(root, root, excludePatterns, recursive, filesList, skippedList);
  } catch (err: any) {
    errors.push({ filePath: root, error: err.message || String(err) });
  }

  const config: CleanConfig = {
    detectComments: options.detectComments ?? true,
    detectTodos: options.detectTodos ?? true,
    detectFixmes: options.detectFixmes ?? true,
    detectConsoleLogs: options.detectConsoleLogs ?? true,
    exclude: excludePatterns
  };

  const allIssues: Issue[] = [];
  const scannedFiles: string[] = [];

  for (const filePath of filesList) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues = scanContent(content, filePath, config);
      allIssues.push(...issues);
      scannedFiles.push(filePath);
    } catch (err: any) {
      errors.push({ filePath, error: err.message || String(err) });
    }
  }

  return {
    filesScanned: scannedFiles,
    filesSkipped: skippedList,
    totalIssues: allIssues.length,
    issues: allIssues,
    errors
  };
}

export async function cleanRepository(options: CleanRepositoryOptions): Promise<CleanRepositoryResult> {
  const root = path.resolve(options.root);
  const recursive = options.recursive ?? true;
  const dryRun = options.dryRun ?? false;

  const fileIgnores = await loadIgnoreFile(root);
  const excludePatterns = [
    ...DEFAULT_EXCLUDES,
    ...(options.exclude ?? []),
    ...fileIgnores
  ];

  const filesList: string[] = [];
  const skippedList: string[] = [];
  const errors: { filePath: string; error: string }[] = [];

  try {
    await collectFiles(root, root, excludePatterns, recursive, filesList, skippedList);
  } catch (err: any) {
    errors.push({ filePath: root, error: err.message || String(err) });
  }

  const config: CleanConfig = {
    detectComments: options.detectComments ?? true,
    detectTodos: options.detectTodos ?? true,
    detectFixmes: options.detectFixmes ?? true,
    detectConsoleLogs: options.detectConsoleLogs ?? true,
    exclude: excludePatterns
  };

  const allIssues: Issue[] = [];
  const scannedFiles: string[] = [];
  const cleanedFiles: string[] = [];
  let bytesSaved = 0;

  for (const filePath of filesList) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues = scanContent(content, filePath, config);
      allIssues.push(...issues);
      scannedFiles.push(filePath);

      if (issues.length > 0) {
        const cleanedContent = cleanContent(content, filePath, config);
        const originalBytes = Buffer.byteLength(content, 'utf-8');
        const cleanedBytes = Buffer.byteLength(cleanedContent, 'utf-8');

        if (cleanedContent !== content) {
          bytesSaved += (originalBytes - cleanedBytes);
          cleanedFiles.push(filePath);

          if (!dryRun) {
            await fs.writeFile(filePath, cleanedContent, 'utf-8');
          }
        }
      }
    } catch (err: any) {
      errors.push({ filePath, error: err.message || String(err) });
    }
  }

  return {
    filesScanned: scannedFiles,
    filesSkipped: skippedList,
    filesCleaned: cleanedFiles,
    bytesSaved,
    totalIssues: allIssues.length,
    issues: allIssues,
    errors
  };
}

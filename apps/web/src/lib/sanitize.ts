import { scanContent, cleanContent } from 'codemelt-sanitize-core';
import { DEFAULT_ANALYZE_CONFIG } from './default-config';

export async function analyzeText(code: string, filename: string) {
  return scanContent(code, filename, DEFAULT_ANALYZE_CONFIG);
}

export async function cleanText(code: string, filename: string) {
  const originalIssues = scanContent(code, filename, DEFAULT_ANALYZE_CONFIG);
  const cleanedCode = cleanContent(code, filename, DEFAULT_ANALYZE_CONFIG);
  const cleanedIssues = scanContent(cleanedCode, filename, DEFAULT_ANALYZE_CONFIG);
  return {
    originalIssues,
    cleanedCode,
    cleanedIssues
  };
}


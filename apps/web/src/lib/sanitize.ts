import { scanContent } from 'codemelt-sanitize-core';
import { DEFAULT_ANALYZE_CONFIG } from './default-config';

export async function analyzeText(code: string, filename: string) {
  return scanContent(code, filename, DEFAULT_ANALYZE_CONFIG);
}

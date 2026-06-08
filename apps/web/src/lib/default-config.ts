import { CleanConfig } from 'codemelt-sanitize-core';

export const DEFAULT_ANALYZE_CONFIG: CleanConfig = {
  detectComments: true,
  detectTodos: true,
  detectFixmes: true,
  detectConsoleLogs: true,
  exclude: []
};

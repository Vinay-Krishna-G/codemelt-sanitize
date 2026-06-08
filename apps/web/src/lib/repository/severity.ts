import type { NoiseType } from 'codemelt-sanitize-shared';

export type SeverityLevel = 'critical' | 'warning' | 'info';

export function getIssueSeverity(type: NoiseType): SeverityLevel {
  switch (type) {
    case 'fixme':
      return 'critical';
    case 'todo':
    case 'console_log':
      return 'warning';
    case 'comment':
    default:
      return 'info';
  }
}

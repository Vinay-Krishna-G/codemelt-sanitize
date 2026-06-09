import type { RepositoryFile } from '../../../types/sanitize';
import type { LanguageBreakdownEntry } from '../../../types/intelligence';

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.html': 'HTML',
  '.css': 'CSS',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.sh': 'Shell'
};

export function calculateLanguageBreakdown(files: RepositoryFile[]): LanguageBreakdownEntry[] {
  const counts: Record<string, { files: number; bytes: number }> = {};
  const totalFiles = files.length || 1;

  files.forEach((file) => {
    const dotIndex = file.path.lastIndexOf('.');
    const ext = dotIndex !== -1 ? file.path.substring(dotIndex).toLowerCase() : '';
    const lang = EXTENSION_LANGUAGE_MAP[ext] || 'Other';

    if (!counts[lang]) {
      counts[lang] = { files: 0, bytes: 0 };
    }
    counts[lang].files += 1;
    counts[lang].bytes += file.originalBytes;
  });

  return Object.entries(counts)
    .map(([language, data]) => ({
      language,
      files: data.files,
      bytes: data.bytes,
      percentage: Math.round((data.files / totalFiles) * 100)
    }))
    .sort((a, b) => b.files - a.files);
}

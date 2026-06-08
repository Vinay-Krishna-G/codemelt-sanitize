import type { RepositoryFile } from '../../types/sanitize';

export function filterFiles(files: RepositoryFile[], query: string): RepositoryFile[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return files;
  return files.filter(f => f.path.toLowerCase().includes(cleanQuery));
}

export function getTopProblemFiles(files: RepositoryFile[], limit: number = 5): RepositoryFile[] {
  return [...files]
    .filter(f => f.issueCount > 0)
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, limit);
}

import type { RepositoryFile } from '../../../types/sanitize';
import type { EntryPointEntry, EntryPointType } from '../../../types/intelligence';

interface PackageJson {
  main?: string;
  module?: string;
  bin?: string | Record<string, string>;
}

export function detectEntryPoints(
  files: RepositoryFile[],
  packageJsonData: PackageJson | null
): EntryPointEntry[] {
  const entryPoints: EntryPointEntry[] = [];
  const addedPaths = new Set<string>();

  // Helper to add entry points with deduplication
  const addEntry = (path: string, type: EntryPointType, priority: number) => {
    if (!addedPaths.has(path)) {
      entryPoints.push({ path, type, priority });
      addedPaths.add(path);
    }
  };

  // 1. Process package.json main/module/bin properties
  if (packageJsonData) {
    if (typeof packageJsonData.main === 'string' && packageJsonData.main) {
      addEntry(packageJsonData.main, 'Library Entry', 50);
    }
    if (typeof packageJsonData.module === 'string' && packageJsonData.module) {
      addEntry(packageJsonData.module, 'Library Entry', 50);
    }
    if (typeof packageJsonData.bin === 'string' && packageJsonData.bin) {
      addEntry(packageJsonData.bin, 'CLI Binary', 70);
    } else if (packageJsonData.bin && typeof packageJsonData.bin === 'object') {
      Object.values(packageJsonData.bin).forEach((val) => {
        if (typeof val === 'string' && val) {
          addEntry(val, 'CLI Binary', 70);
        }
      });
    }
  }

  // 2. Scan file paths for framework/language patterns
  files.forEach((file) => {
    const path = file.path;
    const name = path.split('/').pop() || '';

    // Explicitly exclude layouts
    if (name.startsWith('layout.')) {
      return;
    }

    // Next.js routing patterns
    if (name === 'page.tsx' || name === 'page.ts' || name === 'page.js' || name === 'page.jsx') {
      addEntry(path, 'Page', 100);
    }
    else if (name === 'route.ts' || name === 'route.js' || path.includes('/pages/api/')) {
      addEntry(path, 'API Route', 90);
    }
    else if (name === 'middleware.ts' || name === 'middleware.js') {
      addEntry(path, 'Middleware', 80);
    }

    // Python entry point matches
    else if (['main.py', 'app.py', 'manage.py', 'wsgi.py'].includes(name)) {
      addEntry(path, 'Executable Entry', 60);
    }

    // Go/Rust entry matches
    else if (['main.go', 'main.rs', 'lib.rs'].includes(name)) {
      addEntry(path, 'Executable Entry', 60);
    }

    // Library entry matches only from package-root src/index.ts, src/index.js, src/index.tsx, src/index.jsx
    // and packages/*/src/index.ts, packages/*/src/index.js, packages/*/src/index.tsx, packages/*/src/index.jsx
    else if (
      ['src/index.ts', 'src/index.js', 'src/index.tsx', 'src/index.jsx'].includes(path) ||
      /^packages\/[^/]+\/src\/index\.(ts|js|tsx|jsx)$/.test(path)
    ) {
      addEntry(path, 'Library Entry', 50);
    }

    // Static HTML entry
    else if (name === 'index.html') {
      addEntry(path, 'Static HTML', 40);
    }
  });

  // Sort: Descending by priority, then ascending by path alphabetically
  return entryPoints.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.path.localeCompare(b.path);
  });
}

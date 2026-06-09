import type { RepositoryFile } from '../../../types/sanitize';
import type { 
  TechnologyDetection, 
  FrameworkDetection, 
  PackageManagerType,
  ConfidenceLevel
} from '../../../types/intelligence';

export function getConfidenceLevel(percentage: number): ConfidenceLevel {
  if (percentage >= 90) return 'high';
  if (percentage >= 70) return 'medium';
  return 'low';
}

export function detectPackageManager(files: RepositoryFile[]): PackageManagerType {
  const filePaths = new Set(files.map(f => f.path.split('/').pop()));
  if (filePaths.has('pnpm-lock.yaml')) return 'pnpm';
  if (filePaths.has('bun.lockb')) return 'bun';
  if (filePaths.has('yarn.lock')) return 'yarn';
  if (filePaths.has('package-lock.json')) return 'npm';
  return 'unknown';
}

export function detectTechnologiesAndFrameworks(
  files: RepositoryFile[],
  packageJsonFiles: RepositoryFile[],
  prodDeps: Record<string, string>,
  devDeps: Record<string, string>,
  workspaceCount: number
): {
  detectedTechnologies: TechnologyDetection[];
  frameworks: FrameworkDetection[];
} {
  const totalFiles = files.length;
  const detectedTechnologies: TechnologyDetection[] = [];
  const frameworks: FrameworkDetection[] = [];

  const fileNames = new Set(files.map(f => f.path.split('/').pop()?.toLowerCase() || ''));
  const extList = files.map(f => {
    const dotIndex = f.path.lastIndexOf('.');
    return dotIndex !== -1 ? f.path.substring(dotIndex).toLowerCase() : '';
  });

  const packageJsonFile = packageJsonFiles.find(f => !f.path.includes('/')) || packageJsonFiles[0];

  // 1. Monorepo Detection
  const hasPnpmWorkspace = fileNames.has('pnpm-workspace.yaml');
  const rootPackageJson = packageJsonFiles.find(f => !f.path.includes('/'));
  let rootHasWorkspaces = false;
  if (rootPackageJson) {
    try {
      const data = JSON.parse(rootPackageJson.content);
      if (data.workspaces) rootHasWorkspaces = true;
    } catch {}
  }
  const hasWorkspaceSubdirs = workspaceCount > 0 && files.some(f => f.path.endsWith('package.json') && f.path.includes('/'));

  if (hasPnpmWorkspace || rootHasWorkspaces || hasWorkspaceSubdirs) {
    const evidence: string[] = [];
    if (hasPnpmWorkspace) evidence.push('pnpm-workspace.yaml file found at root');
    if (rootHasWorkspaces) evidence.push('workspaces key configured in root package.json');
    if (hasWorkspaceSubdirs) evidence.push(`Detected package directories (${workspaceCount} workspaces)`);
    
    detectedTechnologies.push({
      type: 'Monorepo',
      confidence: 100,
      confidenceLevel: 'high',
      evidence
    });
  }

  // 2. Next.js Detection (Checking config files and deps)
  const nextConfigExists = Array.from(fileNames).some(name => name.startsWith('next.config.'));
  const nextInDeps = !!(prodDeps['next'] || devDeps['next']);

  if (nextConfigExists || nextInDeps) {
    const confidence = nextConfigExists ? 100 : 95;
    const evidence: string[] = [];
    if (nextConfigExists) evidence.push('next.config configuration file found');
    if (nextInDeps) evidence.push('next package dependency declared in package.json');

    detectedTechnologies.push({
      type: 'Next.js',
      confidence,
      confidenceLevel: getConfidenceLevel(confidence),
      evidence
    });
    frameworks.push({
      name: 'Next.js',
      confidence,
      confidenceLevel: getConfidenceLevel(confidence)
    });
  }

  // 3. React Detection (dependency only, no source file scanning heuristics)
  const reactInDeps = !!(prodDeps['react'] || devDeps['react']);
  if (reactInDeps) {
    detectedTechnologies.push({
      type: 'React',
      confidence: 100,
      confidenceLevel: 'high',
      evidence: ['react package dependency declared in package.json']
    });
    frameworks.push({
      name: 'React',
      confidence: 100,
      confidenceLevel: 'high'
    });
  }

  // 4. Node.js Detection (Checking package.json and JS/TS sources)
  if (packageJsonFile) {
    const hasJsTsSource = files.some(f => {
      const ext = f.path.substring(f.path.lastIndexOf('.')).toLowerCase();
      return ['.ts', '.tsx', '.js', '.jsx'].includes(ext) && !f.path.endsWith('package.json');
    });
    if (hasJsTsSource) {
      detectedTechnologies.push({
        type: 'Node.js',
        confidence: 100,
        confidenceLevel: 'high',
        evidence: ['package.json configuration file present', 'JavaScript/TypeScript source files present']
      });
    } else {
      // Lower Node.js confidence when only package.json exists (e.g. tooling package.json)
      detectedTechnologies.push({
        type: 'Node.js',
        confidence: 60,
        confidenceLevel: 'low',
        evidence: ['package.json configuration file present', 'No JavaScript/TypeScript source files found']
      });
    }
  } else {
    // JS/TS files present without package.json
    const hasJsTsSource = files.some(f => {
      const ext = f.path.substring(f.path.lastIndexOf('.')).toLowerCase();
      return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
    });
    if (hasJsTsSource) {
      detectedTechnologies.push({
        type: 'Node.js',
        confidence: 50,
        confidenceLevel: 'low',
        evidence: ['No package.json file found', 'JavaScript/TypeScript source files present']
      });
    }
  }

  // 5. Python Detection
  const pythonFilesCount = extList.filter(e => e === '.py').length;
  const pythonRatio = totalFiles > 0 ? pythonFilesCount / totalFiles : 0;
  const pyprojectFile = fileNames.has('pyproject.toml');
  const requirementsFile = fileNames.has('requirements.txt');
  const pipfile = fileNames.has('pipfile');

  if (pyprojectFile || requirementsFile || pipfile || pythonRatio > 0.5) {
    const confidence = (pyprojectFile || requirementsFile || pipfile) ? 100 : 85;
    const evidence: string[] = [];
    if (pyprojectFile) evidence.push('pyproject.toml file found');
    if (requirementsFile) evidence.push('requirements.txt file found');
    if (pipfile) evidence.push('Pipfile file found');
    if (pythonRatio > 0.5) evidence.push(`Python source files represent ${Math.round(pythonRatio * 100)}% of the repository`);

    detectedTechnologies.push({
      type: 'Python',
      confidence,
      confidenceLevel: getConfidenceLevel(confidence),
      evidence
    });
  }

  // 6. Go Detection
  const goModFile = fileNames.has('go.mod');
  const hasGoFiles = extList.includes('.go');
  if (goModFile || hasGoFiles) {
    const confidence = goModFile ? 100 : 80;
    const evidence: string[] = [];
    if (goModFile) evidence.push('go.mod configuration file found');
    if (hasGoFiles) evidence.push('Go source files (.go) present');

    detectedTechnologies.push({
      type: 'Go',
      confidence,
      confidenceLevel: getConfidenceLevel(confidence),
      evidence
    });
  }

  // 7. Rust Detection
  const cargoFile = fileNames.has('cargo.toml');
  const hasRustFiles = extList.includes('.rs');
  if (cargoFile || hasRustFiles) {
    const confidence = cargoFile ? 100 : 80;
    const evidence: string[] = [];
    if (cargoFile) evidence.push('Cargo.toml configuration file found');
    if (hasRustFiles) evidence.push('Rust source files (.rs) present');

    detectedTechnologies.push({
      type: 'Rust',
      confidence,
      confidenceLevel: getConfidenceLevel(confidence),
      evidence
    });
  }

  // 8. Static HTML Detection
  const indexHtmlFile = fileNames.has('index.html');
  const hasNoConfig = !packageJsonFile && !pyprojectFile && !requirementsFile && !goModFile && !cargoFile;
  if (indexHtmlFile && hasNoConfig) {
    detectedTechnologies.push({
      type: 'Static HTML',
      confidence: 100,
      confidenceLevel: 'high',
      evidence: ['index.html file present at root', 'No server backend or package manager configuration files found']
    });
  }

  // Extra Framework Detections (Lightweight dependency heuristic)
  const allDeps = { ...prodDeps, ...devDeps };
  if (allDeps['tailwindcss']) {
    frameworks.push({ name: 'Tailwind CSS', confidence: 100, confidenceLevel: 'high' });
  }
  if (allDeps['express']) {
    frameworks.push({ name: 'Express', confidence: 100, confidenceLevel: 'high' });
  }
  if (allDeps['fastify']) {
    frameworks.push({ name: 'Fastify', confidence: 100, confidenceLevel: 'high' });
  }
  if (allDeps['nestjs'] || allDeps['@nestjs/core']) {
    frameworks.push({ name: 'NestJS', confidence: 100, confidenceLevel: 'high' });
  }
  if (allDeps['prisma']) {
    frameworks.push({ name: 'Prisma', confidence: 100, confidenceLevel: 'high' });
  }
  if (allDeps['drizzle-orm']) {
    frameworks.push({ name: 'Drizzle ORM', confidence: 100, confidenceLevel: 'high' });
  }

  return {
    detectedTechnologies,
    frameworks
  };
}

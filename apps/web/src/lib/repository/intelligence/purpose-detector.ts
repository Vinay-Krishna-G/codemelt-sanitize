import type { RepositoryFile } from '../../../types/sanitize';
import type { RepositoryPurpose, ProjectType } from '../../../types/intelligence';

export function detectPurpose(
  primaryType: ProjectType,
  files: RepositoryFile[],
  deps: Record<string, string>,
  coreDirectories: string[]
): RepositoryPurpose {
  const pathNames = files.map(f => f.path.toLowerCase());
  const extList = files.map(f => {
    const dotIndex = f.path.lastIndexOf('.');
    return dotIndex !== -1 ? f.path.substring(dotIndex).toLowerCase() : '';
  });

  // 1. Monorepo Platform
  if (primaryType === 'Monorepo') {
    return {
      purpose: 'Multi-package Platform',
      reason: 'Monorepo workspace configurations and multi-package layouts are present.',
      confidence: 100
    };
  }

  // 2. CLI Tool
  const hasBinConfig = files.some(f => f.path.endsWith('package.json') && f.content.includes('"bin"'));
  const hasBinDir = coreDirectories.some(d => d.toLowerCase() === 'bin');
  if (hasBinConfig || hasBinDir) {
    return {
      purpose: 'CLI Tool',
      reason: 'Executable binaries configuration is defined in package.json or a primary bin/ folder exists.',
      confidence: 95
    };
  }

  // 3. Backend API Server
  const backendFrameworks = ['express', 'fastify', 'nestjs', 'fastapi', 'flask', 'django', 'koa', 'uvicorn'];
  const hasBackendDeps = Object.keys(deps).some(dep => backendFrameworks.includes(dep.toLowerCase()));
  const requirementsFile = files.find(f => f.path.endsWith('requirements.txt'));
  const pyprojectFile = files.find(f => f.path.endsWith('pyproject.toml'));
  const pipfile = files.find(f => f.path.endsWith('Pipfile'));
  const hasPythonBackend = [requirementsFile, pyprojectFile, pipfile].some(f => {
    if (!f) return false;
    const contentLower = f.content.toLowerCase();
    return ['fastapi', 'flask', 'django', 'uvicorn'].some(fw => contentLower.includes(fw));
  });

  if (hasBackendDeps || hasPythonBackend) {
    return {
      purpose: 'Backend API Server',
      reason: 'Standard backend server library dependencies (e.g. Express, Fastify, NestJS, FastAPI) are detected.',
      confidence: 90
    };
  }

  // 4. Documentation Site
  const mdCount = extList.filter(e => e === '.md').length;
  const docsRatio = files.length > 0 ? mdCount / files.length : 0;
  const hasDocsFolder = coreDirectories.some(d => ['docs', 'documentation'].includes(d.toLowerCase()));
  if (docsRatio > 0.4 || hasDocsFolder) {
    return {
      purpose: 'Documentation Site',
      reason: 'Dedicated documentation directories or a high percentage of Markdown files are present.',
      confidence: 85
    };
  }

  // 5. E-commerce Frontend
  const ecomKeywords = ['stripe', 'shopify', 'snipcart', 'cart', 'checkout', 'commerce'];
  const hasEcomDeps = Object.keys(deps).some(dep => ecomKeywords.some(keyword => dep.toLowerCase().includes(keyword)));
  const hasEcomPaths = pathNames.some(path => ecomKeywords.some(keyword => path.includes(keyword)));
  if ((primaryType === 'Next.js' || primaryType === 'React') && (hasEcomDeps || hasEcomPaths)) {
    return {
      purpose: 'E-commerce Frontend',
      reason: 'Integrates payment gateways (e.g. Stripe) or Shopify stores, with active cart/checkout routing.',
      confidence: 90
    };
  }

  // 6. SaaS Dashboard
  const saasKeywords = ['auth', 'clerk', 'next-auth', 'lucia', 'dashboard', 'admin', 'supabase'];
  const hasSaasDeps = Object.keys(deps).some(dep => saasKeywords.some(keyword => dep.toLowerCase().includes(keyword)));
  const hasSaasPaths = pathNames.some(path => saasKeywords.some(keyword => path.includes(keyword)));
  if (primaryType === 'Next.js' && (hasSaasDeps || hasSaasPaths)) {
    return {
      purpose: 'SaaS Dashboard',
      reason: 'Configured with Clerk, Supabase, or Auth services alongside standard dashboard layout paths.',
      confidence: 90
    };
  }

  // 7. Web Application Frontend
  if (primaryType === 'Next.js' || primaryType === 'React') {
    return {
      purpose: 'Web Application Frontend',
      reason: 'Configured with web browser frontend dependencies (React or Next.js) for layout rendering.',
      confidence: 85
    };
  }

  // 8. Shared Library
  const hasCargoLib = files.some(f => f.path.endsWith('Cargo.toml') && f.content.includes('[lib]'));
  const hasPackageMain = files.some(f => f.path.endsWith('package.json') && f.content.includes('"main"') && !f.content.includes('"react"') && !f.content.includes('"next"'));
  if (hasCargoLib || hasPackageMain) {
    return {
      purpose: 'Shared Library',
      reason: 'Exposes library module interfaces or Cargo library targets for distribution.',
      confidence: 80
    };
  }

  // 9. Fallback
  return {
    purpose: 'Software Project',
    reason: 'Generic file extensions structure with standard layout layout characteristics.',
    confidence: 50
  };
}

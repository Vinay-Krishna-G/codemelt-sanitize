import type { AIContextPreset, AITarget } from '../../../types/intelligence';

export const PRESET_DESCRIPTIONS: Record<AIContextPreset, string> = {
  'bug-fix': 'Focuses on identifying entry points, dependencies, and codebase structure to help resolve a bug.',
  'feature-dev': 'Focuses on codebase pattern analysis, structure, and entry points to help build new features.',
  refactor: 'Focuses on technical debt indicators, directory layout, and complexity score to guide structural improvement.',
  'code-review': 'Evaluates overall architecture, lint warning states, and dependency patterns to aid peer review.',
  'arch-review': 'Focuses on workspaces packages, core layout directories, and primary stack to review high-level design.',
  'perf-opt': 'Details runtime frameworks, production packages, and size footprints to optimize responsiveness.',
  'security-review': 'Reviews package manager lockfiles, production dependencies, and tech stacks for vulnerability checks.'
};

export const PRESET_INSTRUCTIONS: Record<AIContextPreset, string> = {
  'bug-fix': 'You are tasked with identifying and fixing a bug in this repository. Study the entry points, architecture summary, and dependency declarations to trace the code path and isolate the problem.',
  'feature-dev': 'You are tasked with building a new feature. Analyze the existing directory structures, technology stack, and patterns to locate the correct placement and structure for new files or modules.',
  refactor: 'You are refactoring code paths in this codebase. Analyze the repository complexity score and files stats to find files, folders, or modules that present opportunities for cleanup or simplification.',
  'code-review': 'Conduct a professional code review of the workspace. Evaluate the stack warnings, complexity, language layout, and core entry points for standards compliance and potential defects.',
  'arch-review': 'Perform a high-level architectural review. Examine workspace counts, package folders, primary purpose, and core directories to assess system architecture and design integrity.',
  'perf-opt': 'Audit the project for performance bottlenecks. Review framework configurations, runtime dependency list sizes, and file sizes to identify code splitting or tree shaking targets.',
  'security-review': 'Audit the project for security weaknesses. Identify dependency declarations, package manager configuration anomalies, or lockfile conflicts to avoid risks.'
};

export const TARGET_INSTRUCTIONS: Record<AITarget, string> = {
  chatgpt: 'Format the response as a balanced, highly-structured markdown guide with detailed headers, bullet points, and code block setups.',
  claude: 'Provide an architecture-heavy overview. Highlight systemic interfaces, modular boundary structures, package links, and deep hierarchy flows.',
  gemini: 'Be extremely concise. Deliver a dense, space-efficient list of key metadata, entry points, and dependencies, omitting conversational filler.',
  cursor: 'Deliver implementation-focused prompt instructions. Prioritize exact code-symbol entry paths, config directories, and developer workflows.',
  windsurf: 'Deliver implementation-focused prompt instructions. Prioritize exact code-symbol entry paths, config directories, and developer workflows.',
  copilot: 'Deliver code-generation-focused instructions. Focus on code generation triggers, imports syntax references, package versions, and functions skeletons.'
};

export function getPromptTemplate(preset: AIContextPreset, target: AITarget): string {
  const presetInst = PRESET_INSTRUCTIONS[preset];
  const targetInst = TARGET_INSTRUCTIONS[target];
  
  return `Context Action: ${presetInst}\nTarget LLM Optimization: ${targetInst}\n`;
}

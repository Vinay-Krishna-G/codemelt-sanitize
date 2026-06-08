/**
 * CodeMelt Clean - Core Scanner
 * 
 * DESIGN BEHAVIOR & LIMITATIONS (v0.1.0 MVP):
 * 1. Line-Based Scanning:
 *    The scanner runs statefully line-by-line to stay lightweight and avoid AST dependency.
 *    Because of this, it cannot trace multi-line block syntax trees or scopes.
 * 2. Multiline console.log:
 *    Console logs spanning multiple lines (e.g. log statements split with newlines)
 *    are not fully parsed/captured beyond the line where the `console.log` expression begins.
 * 3. Chained console.log:
 *    Chained expressions or statements nested inside other expressions on the same line
 *    are matched greedily from the 'console.log' call to the end of that code segment.
 * 4. TODO/FIXME Precedence:
 *    When both "TODO" and "FIXME" keywords appear in a single comment string,
 *    "FIXME" takes precedence and is flagged as a `fixme` issue (if detectFixmes is enabled).
 */
import { Issue, CleanConfig, NoiseType } from 'codemelt-sanitize-shared';


export interface CommentSyntax {
  singleLine?: string;
  blockStart?: string;
  blockEnd?: string;
}

export function getCommentSyntax(ext: string): CommentSyntax {
  switch (ext) {
    case '.py':
    case '.rb':
    case '.sh':
    case '.yaml':
    case '.yml':
      return { singleLine: '#' };
    case '.html':
    case '.xml':
      return { blockStart: '<!--', blockEnd: '-->' };
    case '.css':
      return { blockStart: '/*', blockEnd: '*/' };
    default:
      // JS, TS, JSX, TSX, Rust, Go, C++, C#, Java, PHP
      return {
        singleLine: '//',
        blockStart: '/*',
        blockEnd: '*/'
      };
  }
}

export function getCommentStartIndex(line: string, marker: string): number {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (char === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (line.substring(i, i + marker.length) === marker) {
        return i;
      }
    }
  }
  return -1;
}

export function getConsoleLogStartIndex(line: string): number {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (char === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (line.substring(i, i + 11) === 'console.log') {
        return i;
      }
    }
  }
  return -1;
}

function processCommentText(
  text: string,
  lineNum: number,
  filePath: string,
  config: CleanConfig,
  issues: Issue[]
) {
  const hasTodo = /\bTODO\b/i.test(text);
  const hasFixme = /\bFIXME\b/i.test(text);

  let type: NoiseType | null = null;
  let message = '';

  if (hasFixme && config.detectFixmes) {
    type = 'fixme';
    message = 'Detected FIXME comment';
  } else if (hasTodo && config.detectTodos) {
    type = 'todo';
    message = 'Detected TODO comment';
  } else if (config.detectComments) {
    type = 'comment';
    message = 'Detected comment';
  }

  if (type) {
    issues.push({
      id: `${type}-${lineNum}-${issues.length}`,
      type,
      message,
      filePath,
      line: lineNum,
      rawContent: text
    });
  }
}

export function scanLine(
  line: string,
  lineNum: number,
  filePath: string,
  config: CleanConfig,
  syntax: CommentSyntax,
  state: { inBlockComment: boolean }
): Issue[] {
  const issues: Issue[] = [];
  let codePart = '';
  let commentPart = '';

  if (state.inBlockComment) {
    if (syntax.blockEnd) {
      const endIdx = getCommentStartIndex(line, syntax.blockEnd);
      if (endIdx !== -1) {
        commentPart = line.substring(0, endIdx + syntax.blockEnd.length);
        codePart = line.substring(endIdx + syntax.blockEnd.length);
        state.inBlockComment = false;
        processCommentText(commentPart, lineNum, filePath, config, issues);
      } else {
        commentPart = line;
        processCommentText(commentPart, lineNum, filePath, config, issues);
      }
    } else {
      commentPart = line;
      processCommentText(commentPart, lineNum, filePath, config, issues);
    }
  } else {
    let blockStartIdx = -1;
    if (syntax.blockStart) {
      blockStartIdx = getCommentStartIndex(line, syntax.blockStart);
    }

    let singleLineIdx = -1;
    if (syntax.singleLine) {
      singleLineIdx = getCommentStartIndex(line, syntax.singleLine);
    }

    if (blockStartIdx !== -1 && singleLineIdx !== -1) {
      if (blockStartIdx < singleLineIdx) {
        singleLineIdx = -1;
      } else {
        blockStartIdx = -1;
      }
    }

    if (blockStartIdx !== -1 && syntax.blockStart && syntax.blockEnd) {
      codePart = line.substring(0, blockStartIdx);
      const rest = line.substring(blockStartIdx);
      const endIdx = getCommentStartIndex(rest, syntax.blockEnd);
      if (endIdx !== -1) {
        commentPart = rest.substring(0, endIdx + syntax.blockEnd.length);
        const postCode = rest.substring(endIdx + syntax.blockEnd.length);
        codePart += postCode;
        processCommentText(commentPart, lineNum, filePath, config, issues);
      } else {
        commentPart = rest;
        state.inBlockComment = true;
        processCommentText(commentPart, lineNum, filePath, config, issues);
      }
    } else if (singleLineIdx !== -1 && syntax.singleLine) {
      codePart = line.substring(0, singleLineIdx);
      commentPart = line.substring(singleLineIdx);
      processCommentText(commentPart, lineNum, filePath, config, issues);
    } else {
      codePart = line;
    }
  }

  const dotIdx = filePath.lastIndexOf('.');
  const ext = dotIdx !== -1 ? filePath.substring(dotIdx) : '';
  const isJsTs = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.html'].includes(ext);

  if (isJsTs && config.detectConsoleLogs && codePart) {
    const logIdx = getConsoleLogStartIndex(codePart);
    if (logIdx !== -1) {
      issues.push({
        id: `log-${lineNum}-${issues.length}`,
        type: 'console_log',
        message: 'Detected console.log statement',
        filePath,
        line: lineNum,
        rawContent: codePart.substring(logIdx)
      });
    }
  }

  return issues;
}

export function scanContent(
  content: string,
  filePath: string,
  config: CleanConfig
): Issue[] {
  const dotIdx = filePath.lastIndexOf('.');
  const ext = dotIdx !== -1 ? filePath.substring(dotIdx) : '';
  const syntax = getCommentSyntax(ext);
  const lines = content.split(/\r?\n/);
  const state = { inBlockComment: false };
  const allIssues: Issue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const issues = scanLine(lines[i], lineNum, filePath, config, syntax, state);
    allIssues.push(...issues);
  }

  return allIssues;
}

import { CleanConfig } from 'codemelt-sanitize-shared';
import {
  getCommentSyntax,
  getCommentStartIndex,
  getConsoleLogStartIndex,
  CommentSyntax
} from './scanner.js';

function shouldStripComment(text: string, config: CleanConfig): boolean {
  const hasTodo = /\bTODO\b/i.test(text);
  const hasFixme = /\bFIXME\b/i.test(text);

  if (hasFixme) {
    return config.detectFixmes;
  }
  if (hasTodo) {
    return config.detectTodos;
  }
  return config.detectComments;
}

function cleanConsoleLogs(code: string, filePath: string, config: CleanConfig): string {
  const dotIdx = filePath.lastIndexOf('.');
  const ext = dotIdx !== -1 ? filePath.substring(dotIdx) : '';
  const isJsTs = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.html'].includes(ext);

  if (!isJsTs || !config.detectConsoleLogs) {
    return code;
  }

  let result = code;
  let logIdx = getConsoleLogStartIndex(result);

  while (logIdx !== -1) {
    const openParenIndex = result.indexOf('(', logIdx);
    if (openParenIndex !== -1 && openParenIndex < logIdx + 20) {
      let balance = 1;
      let forwardIndex = openParenIndex + 1;
      let subStringChar: string | null = null;
      let foundEnd = false;

      while (forwardIndex < result.length) {
        const char = result[forwardIndex];
        if (char === '\\') {
          forwardIndex += 2;
          continue;
        }
        if (subStringChar) {
          if (char === subStringChar) {
            subStringChar = null;
          }
        } else if (char === '"' || char === "'" || char === '`') {
          subStringChar = char;
        } else if (char === '(') {
          balance++;
        } else if (char === ')') {
          balance--;
          if (balance === 0) {
            let endOffset = forwardIndex + 1;

            while (endOffset < result.length && /\s/.test(result[endOffset])) {
              if (result[endOffset] === '\n' || result[endOffset] === '\r') {
                break;
              }
              endOffset++;
            }
            if (result[endOffset] === ';') {
              endOffset++;
            }

            result = result.substring(0, logIdx) + result.substring(endOffset);
            foundEnd = true;
            break;
          }
        }
        forwardIndex++;
      }
      if (foundEnd) {
        logIdx = getConsoleLogStartIndex(result);
        continue;
      }
    }
    break;
  }

  return result;
}

export function cleanLine(
  line: string,
  lineNum: number,
  filePath: string,
  config: CleanConfig,
  syntax: CommentSyntax,
  state: { inBlockComment: boolean }
): string {
  let cleanedLine = line;

  if (state.inBlockComment) {
    if (syntax.blockEnd) {
      const endIdx = getCommentStartIndex(line, syntax.blockEnd);
      if (endIdx !== -1) {
        const commentPart = line.substring(0, endIdx + syntax.blockEnd.length);
        const codePart = line.substring(endIdx + syntax.blockEnd.length);
        state.inBlockComment = false;

        const shouldStrip = shouldStripComment(commentPart, config);
        const cleanedCodePart = cleanConsoleLogs(codePart, filePath, config);

        if (shouldStrip) {
          cleanedLine = cleanedCodePart;
        } else {
          cleanedLine = commentPart + cleanedCodePart;
        }
      } else {
        const shouldStrip = shouldStripComment(line, config);
        if (shouldStrip) {
          cleanedLine = '';
        } else {
          cleanedLine = line;
        }
      }
    } else {
      const shouldStrip = shouldStripComment(line, config);
      if (shouldStrip) {
        cleanedLine = '';
      } else {
        cleanedLine = line;
      }
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
      const codePart = line.substring(0, blockStartIdx);
      const rest = line.substring(blockStartIdx);
      const endIdx = getCommentStartIndex(rest, syntax.blockEnd);
      if (endIdx !== -1) {
        const commentPart = rest.substring(0, endIdx + syntax.blockEnd.length);
        const postCode = rest.substring(endIdx + syntax.blockEnd.length);

        const shouldStrip = shouldStripComment(commentPart, config);
        if (shouldStrip) {
          const cleanedCodePart = cleanConsoleLogs(codePart, filePath, config);
          const cleanedPostCode = cleanConsoleLogs(postCode, filePath, config);
          cleanedLine = cleanedCodePart + cleanedPostCode;
        } else {
          const cleanedCodePart = cleanConsoleLogs(codePart, filePath, config);
          const cleanedPostCode = cleanConsoleLogs(postCode, filePath, config);
          cleanedLine = cleanedCodePart + commentPart + cleanedPostCode;
        }
      } else {
        const commentPart = rest;
        state.inBlockComment = true;

        const shouldStrip = shouldStripComment(commentPart, config);
        const cleanedCode = cleanConsoleLogs(codePart, filePath, config);

        if (shouldStrip) {
          cleanedLine = cleanedCode;
        } else {
          cleanedLine = cleanedCode + commentPart;
        }
      }
    } else if (singleLineIdx !== -1 && syntax.singleLine) {
      const codePart = line.substring(0, singleLineIdx);
      const commentPart = line.substring(singleLineIdx);

      const shouldStrip = shouldStripComment(commentPart, config);
      const cleanedCode = cleanConsoleLogs(codePart, filePath, config);

      if (shouldStrip) {
        cleanedLine = cleanedCode.trimEnd();
      } else {
        cleanedLine = cleanedCode + commentPart;
      }
    } else {
      cleanedLine = cleanConsoleLogs(line, filePath, config);
    }
  }

  return cleanedLine;
}

export function cleanContent(
  content: string,
  filePath: string,
  config: CleanConfig
): string {
  const dotIdx = filePath.lastIndexOf('.');
  const ext = dotIdx !== -1 ? filePath.substring(dotIdx) : '';
  const syntax = getCommentSyntax(ext);
  const lines = content.split(/\r?\n/);
  const state = { inBlockComment: false };
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cleaned = cleanLine(lines[i], i + 1, filePath, config, syntax, state);
    cleanedLines.push(cleaned);
  }

  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  return cleanedLines.join(lineEnding);
}

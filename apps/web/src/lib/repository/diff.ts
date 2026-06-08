export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export function computeLineDiff(
  original: string,
  cleaned: string
): { left: DiffLine[]; right: DiffLine[] } {
  const origLines = original.split(/\r?\n/);
  const cleanLines = cleaned.split(/\r?\n/);

  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  let cleanIdx = 0;
  for (let origIdx = 0; origIdx < origLines.length; origIdx++) {
    const origLine = origLines[origIdx];
    const cleanLine = cleanLines[cleanIdx];

    if (cleanIdx < cleanLines.length && origLine === cleanLine) {
      left.push({ type: 'unchanged', content: origLine, lineNumber: origIdx + 1 });
      right.push({ type: 'unchanged', content: cleanLine, lineNumber: cleanIdx + 1 });
      cleanIdx++;
    } else {
      left.push({ type: 'removed', content: origLine, lineNumber: origIdx + 1 });
      right.push({ type: 'removed', content: '', lineNumber: undefined });
    }
  }

  return { left, right };
}

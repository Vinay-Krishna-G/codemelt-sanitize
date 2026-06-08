import { NextResponse } from 'next/server';
import { analyzeText } from '@/lib/sanitize';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, filename } = body;

    if (typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Code cannot be empty' },
        { status: 400 }
      );
    }

    if (code.length > 500000) {
      return NextResponse.json(
        { success: false, error: 'Input exceeds maximum allowed size' },
        { status: 413 }
      );
    }

    const fileToScan = filename || 'input.js';
    const issues = await analyzeText(code, fileToScan);

    const countByType = (type: string) => issues.filter(i => i.type === type).length;
    const comments = countByType('comment');
    const todos = countByType('todo');
    const fixmes = countByType('fixme');
    const consoleLogs = countByType('console_log');

    return NextResponse.json({
      version: '1',
      success: true,
      filename: fileToScan,
      summary: {
        comments,
        todos,
        fixmes,
        consoleLogs,
        total: issues.length
      },
      issues
    });
  } catch (error) {
    console.error('Core scan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze code' },
      { status: 500 }
    );
  }
}

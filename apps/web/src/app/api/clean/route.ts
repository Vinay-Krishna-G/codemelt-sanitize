import { NextResponse } from 'next/server';
import { cleanText } from '@/lib/sanitize';

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

    const encoder = new TextEncoder();
    const originalBytes = encoder.encode(code).length;

    if (originalBytes > 500000) {
      return NextResponse.json(
        { success: false, error: 'Input exceeds maximum allowed size' },
        { status: 413 }
      );
    }

    const fileToScan = filename || 'input.js';
    const { originalIssues, cleanedCode, cleanedIssues } = await cleanText(code, fileToScan);

    const cleanedBytes = encoder.encode(cleanedCode).length;
    const bytesSaved = Math.max(0, originalBytes - cleanedBytes);
    const originalIssuesCount = originalIssues.length;
    const cleanedIssuesCount = cleanedIssues.length;
    const issuesRemoved = Math.max(0, originalIssuesCount - cleanedIssuesCount);
    
    const percentReduction = originalIssuesCount === 0 
      ? 0 
      : Math.round((issuesRemoved / originalIssuesCount) * 100);

    return NextResponse.json({
      version: '1',
      success: true,
      filename: fileToScan,
      originalCode: code,
      cleanedCode,
      summary: {
        originalBytes,
        cleanedBytes,
        bytesSaved,
        originalIssuesCount,
        cleanedIssuesCount,
        issuesRemoved,
        percentReduction
      }
    });
  } catch (error) {
    console.error('Core clean error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean code' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getRecentLogs, getAllLogFiles, getLogFileContent } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Simple auth check - require a secret key
    const authKey = request.headers.get('x-log-key') || request.nextUrl.searchParams.get('key');
    const expectedKey = process.env.LOG_ACCESS_KEY || 'arcsapp-logs-2024';
    
    if (authKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide ?key=YOUR_LOG_ACCESS_KEY' },
        { status: 401 }
      );
    }

    const file = request.nextUrl.searchParams.get('file');
    const lines = parseInt(request.nextUrl.searchParams.get('lines') || '100');

    if (file === 'list') {
      // List all log files
      const files = await getAllLogFiles();
      return NextResponse.json({ files });
    }

    if (file) {
      // Get specific log file
      const content = await getLogFileContent(file, lines);
      return NextResponse.json({ 
        file,
        lines: content.length,
        content 
      });
    }

    // Get today's logs
    const logs = await getRecentLogs(lines);
    
    return NextResponse.json({
      date: new Date().toISOString().split('T')[0],
      lines: logs.length,
      logs
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

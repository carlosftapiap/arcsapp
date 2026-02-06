import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    checks: {
      database: 'unknown',
      supabase: 'unknown',
    }
  };

  // Check database connection
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    health.checks.database = 'ok';
  } catch (error: any) {
    health.checks.database = `error: ${error.message}`;
    health.status = 'degraded';
    logger.error('Health check - Database error', error);
  }

  // Check Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        }
      });
      health.checks.supabase = response.ok ? 'ok' : `error: ${response.status}`;
    }
  } catch (error: any) {
    health.checks.supabase = `error: ${error.message}`;
    health.status = 'degraded';
    logger.error('Health check - Supabase error', error);
  }

  const responseTime = Date.now() - startTime;
  
  logger.info('Health check completed', { 
    status: health.status, 
    responseTime: `${responseTime}ms`,
    checks: health.checks 
  });

  return NextResponse.json({
    ...health,
    responseTime: `${responseTime}ms`
  }, {
    status: health.status === 'ok' ? 200 : 503
  });
}

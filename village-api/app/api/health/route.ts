// Health check endpoint - critical for monitoring
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redis from '@/lib/redis';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, any>,
    responseTime: 0
  };

  // Check Database
  try {
    await pool.query('SELECT NOW()');
    checks.checks.database = { status: 'up', message: 'PostgreSQL connected' };
  } catch (error) {
    checks.checks.database = { status: 'down', error: String(error) };
    checks.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.checks.redis = { status: 'up', message: 'Redis connected' };
  } catch (error) {
    checks.checks.redis = { status: 'down', error: String(error) };
    checks.status = 'degraded';
  }

  // Check API response time
  checks.responseTime = Date.now() - startTime;

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}

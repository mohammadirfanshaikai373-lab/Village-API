// Admin Dashboard Stats
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Platform Statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM states) as total_states,
        (SELECT COUNT(*) FROM districts) as total_districts,
        (SELECT COUNT(*) FROM sub_districts) as total_sub_districts,
        (SELECT COUNT(*) FROM villages) as total_villages,
        (SELECT COUNT(*) FROM api_keys WHERE is_active = true) as active_api_keys,
        (SELECT COUNT(DISTINCT DATE(timestamp)) FROM api_usage_logs WHERE timestamp > NOW() - INTERVAL '30 days') as days_with_usage,
        (SELECT SUM(1) FROM api_usage_logs WHERE timestamp > NOW() - INTERVAL '24 hours') as requests_24h,
        (SELECT SUM(1) FROM api_usage_logs WHERE timestamp > NOW() - INTERVAL '30 days') as requests_30d
    `);

    // Trending Endpoints
    const endpoints = await pool.query(`
      SELECT endpoint, COUNT(*) as count, AVG(response_time) as avg_time
      FROM api_usage_logs
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 5
    `);

    // API Key Plans Distribution
    const plans = await pool.query(`
      SELECT plan, COUNT(*) as count
      FROM api_keys
      GROUP BY plan
    `);

    return NextResponse.json({
      success: true,
      locationData: stats.rows[0],
      trendingEndpoints: endpoints.rows,
      planDistribution: plans.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

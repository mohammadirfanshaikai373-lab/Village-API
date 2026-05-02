// Analytics endpoint for B2B clients to view their API usage
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withApiAuth, ApiAuthContext } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  return withApiAuth(req, async (request, context) => {
    return handleAnalytics(request, context);
  });
}

async function handleAnalytics(req: NextRequest, context: ApiAuthContext) {
  try {
    const days = parseInt(req.nextUrl.searchParams.get('days') || '7');
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get daily stats
    const dailyResult = await pool.query(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status != 'success' THEN 1 END) as failed_requests,
        ROUND(AVG(response_time_ms)) as avg_response_time_ms,
        MAX(response_time_ms) as max_response_time_ms,
        MIN(response_time_ms) as min_response_time_ms
       FROM usage_logs
       WHERE user_id = $1 AND timestamp >= $2
       GROUP BY DATE(timestamp)
       ORDER BY date DESC`,
      [context.userId, fromDate]
    );

    // Get endpoint-wise stats
    const endpointResult = await pool.query(
      `SELECT 
        endpoint,
        method,
        COUNT(*) as requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        ROUND(AVG(response_time_ms)) as avg_response_time_ms
       FROM usage_logs
       WHERE user_id = $1 AND timestamp >= $2
       GROUP BY endpoint, method
       ORDER BY requests DESC
       LIMIT 20`,
      [context.userId, fromDate]
    );

    // Get summary
    const summaryResult = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status != 'success' THEN 1 END) as failed_requests,
        ROUND(AVG(response_time_ms)) as avg_response_time_ms,
        MAX(response_time_ms) as max_response_time_ms
       FROM usage_logs
       WHERE user_id = $1 AND timestamp >= $2`,
      [context.userId, fromDate]
    );

    const summary = summaryResult.rows[0];

    return NextResponse.json({
      period: { days, fromDate, toDate: new Date() },
      plan: context.plan,
      rateLimit: context.rateLimit,
      requestsToday: context.requestsToday,
      summary: {
        totalRequests: parseInt(summary.total_requests) || 0,
        successfulRequests: parseInt(summary.successful_requests) || 0,
        failedRequests: parseInt(summary.failed_requests) || 0,
        successRate: summary.total_requests > 0 
          ? ((parseInt(summary.successful_requests) / parseInt(summary.total_requests)) * 100).toFixed(2) + '%'
          : 'N/A',
        avgResponseTime: parseInt(summary.avg_response_time_ms) || 0,
        maxResponseTime: parseInt(summary.max_response_time_ms) || 0
      },
      dailyStats: dailyResult.rows,
      topEndpoints: endpointResult.rows
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

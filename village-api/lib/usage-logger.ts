// Usage Logging System
import pool from '@/lib/db';

export interface UsageLog {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp?: Date;
}

export async function logUsage(log: UsageLog): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO api_usage_logs 
       (api_key_id, endpoint, method, status_code, response_time, timestamp) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [log.apiKeyId, log.endpoint, log.method, log.statusCode, log.responseTime]
    );
  } catch (error) {
    console.error('Usage logging error:', error);
  }
}

export async function getAnalytics(
  apiKeyId: string,
  days: number = 7
): Promise<any> {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
        AVG(response_time) as avg_response_time,
        MAX(response_time) as max_response_time,
        MIN(response_time) as min_response_time
      FROM api_usage_logs
      WHERE api_key_id = $1 AND timestamp > NOW() - INTERVAL '${days} days'`,
      [apiKeyId]
    );

    const stats = result.rows[0];
    const successRate = stats.total_requests > 0 
      ? ((stats.successful_requests / stats.total_requests) * 100).toFixed(2)
      : '0.00';

    return {
      totalRequests: parseInt(stats.total_requests),
      successfulRequests: parseInt(stats.successful_requests),
      failedRequests: parseInt(stats.failed_requests),
      successRate: `${successRate}%`,
      avgResponseTime: Math.round(stats.avg_response_time || 0),
      maxResponseTime: Math.round(stats.max_response_time || 0),
      minResponseTime: Math.round(stats.min_response_time || 0),
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return null;
  }
}

export async function getEndpointStats(
  apiKeyId: string,
  days: number = 7
): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT 
        endpoint,
        COUNT(*) as request_count,
        AVG(response_time) as avg_time,
        SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) as success_count
      FROM api_usage_logs
      WHERE api_key_id = $1 AND timestamp > NOW() - INTERVAL '${days} days'
      GROUP BY endpoint
      ORDER BY request_count DESC
      LIMIT 10`,
      [apiKeyId]
    );

    return result.rows;
  } catch (error) {
    console.error('Endpoint stats error:', error);
    return [];
  }
}

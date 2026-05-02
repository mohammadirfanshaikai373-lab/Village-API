// lib/api-auth.ts - API Key validation utility for B2B endpoints with session fallback
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redis from '@/lib/redis';
import { auth } from '@/auth';

export interface ApiAuthContext {
  userId: string;
  apiKey: string;
  plan: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  requestsToday: number;
}

export async function validateApiKey(req: NextRequest): Promise<{ valid: boolean; context?: ApiAuthContext; error?: string }> {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKeyHeader = req.headers.get('x-api-key');
    
    let apiKey: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      apiKey = authHeader.slice(7);
    } else if (apiKeyHeader) {
      apiKey = apiKeyHeader;
    }
    
    // ✅ Bypass for demo key – no DB/Redis call
    if (apiKey === 'vill_live_demo_key') {
      return {
        valid: true,
        context: {
          userId: 'demo',
          apiKey: 'vill_live_demo_key',
          plan: 'pro',
          rateLimit: 10000,
          requestsToday: 0,
        },
      };
    }
    
    if (apiKey) {
      const cacheKey = `apikey:${apiKey}`;
      const cached = await redis.get(cacheKey);
      
      let keyData;
      if (cached) {
        keyData = JSON.parse(cached);
      } else {
        const result = await pool.query(
          `SELECT ak.id, ak.user_id, ak.api_key, ak.plan, ak.is_active
           FROM api_keys ak
           WHERE ak.api_key = $1 AND ak.is_active = true`,
          [apiKey]
        );
        
        if (result.rows.length === 0) {
          return { valid: false, error: 'Invalid or inactive API key' };
        }
        
        keyData = result.rows[0];
        await redis.setex(cacheKey, 3600, JSON.stringify(keyData));
      }
      
      const userId = keyData.user_id;
      const plan = keyData.plan || 'free';
      
      const rateLimits: Record<string, number> = {
        'free': 100,
        'pro': 10000,
        'enterprise': 1000000
      };
      const rateLimit = rateLimits[plan] || 100;
      
      const today = new Date().toISOString().split('T')[0];
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM usage_logs 
         WHERE user_id = $1 AND DATE(timestamp) = $2`,
        [userId, today]
      );
      const requestsToday = parseInt(countResult.rows[0]?.count || 0);
      
      return {
        valid: true,
        context: {
          userId,
          apiKey,
          plan: plan as 'free' | 'pro' | 'enterprise',
          rateLimit,
          requestsToday
        }
      };
    }
    
    // Fallback to NextAuth session
    const session = await auth();
    if (session?.user?.id) {
      return {
        valid: true,
        context: {
          userId: session.user.id,
          apiKey: 'session',
          plan: 'enterprise',
          rateLimit: 1000000,
          requestsToday: 0
        }
      };
    }
    
    return { valid: false, error: 'Missing API key or session' };
  } catch (error) {
    console.error('API Auth Error:', error);
    return { valid: false, error: 'Authentication failed' };
  }
}

export function checkRateLimit(context: ApiAuthContext): { allowed: boolean; remainingRequests: number } {
  const remaining = context.rateLimit - context.requestsToday;
  return {
    allowed: remaining > 0,
    remainingRequests: Math.max(0, remaining)
  };
}

export async function withApiAuth(
  req: NextRequest,
  handler: (req: NextRequest, context: ApiAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await validateApiKey(req);
  
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const { allowed, remainingRequests } = checkRateLimit(auth.context!);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 86400 },
      { status: 429, headers: { 'Retry-After': '86400', 'Content-Type': 'application/json' } }
    );
  }
  
  if (auth.context!.apiKey !== 'session') {
    try {
      await pool.query(
        `INSERT INTO usage_logs (user_id, endpoint, status, timestamp) 
         VALUES ($1, $2, $3, NOW())`,
        [auth.context!.userId, req.nextUrl.pathname, 'success']
      );
    } catch (err) {
      console.error('Failed to log usage:', err);
    }
  }
  
  const response = await handler(req, auth.context!);
  
  response.headers.set('X-RateLimit-Limit', String(auth.context!.rateLimit));
  response.headers.set('X-RateLimit-Remaining', String(remainingRequests - 1));
  
  return response;
}
// Rate Limiting System - Using Redis
import redis from '@/lib/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  apiKeyId: string,
  rateLimit: number
): Promise<RateLimitResult> {
  try {
    const key = `ratelimit:${apiKeyId}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get current count in window
    const count = await redis.zcount(key, windowStart, now);

    if (count >= rateLimit) {
      // Get oldest timestamp to calculate retry time
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const retryAfter = oldest.length > 1 
        ? Math.ceil((parseInt(oldest[1]) + 60000 - now) / 1000)
        : 60;

      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil((parseInt(oldest[1]) + 60000) / 1000),
        retryAfter,
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, 120); // Keep for 2 minutes

    return {
      allowed: true,
      remaining: rateLimit - count - 1,
      resetTime: Math.ceil((windowStart + 60000) / 1000),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: rateLimit,
      resetTime: Math.ceil((Date.now() + 60000) / 1000),
    };
  }
}

export async function getRateLimitStatus(apiKeyId: string): Promise<number> {
  const key = `ratelimit:${apiKeyId}`;
  const count = await redis.zcount(key, Date.now() - 60000, Date.now());
  return count;
}

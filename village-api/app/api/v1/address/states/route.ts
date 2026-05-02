// app/api/v1/address/states/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redis from '@/lib/redis';
import { withApiAuth } from '@/lib/api-auth';
import { jsonError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  return withApiAuth(req, async () => {
    return handleGetStates();
  });
}

async function handleGetStates() {
  const cacheKey = 'states:list';

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(JSON.parse(cached));
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const result = await pool.query('SELECT id, name, census_code FROM states ORDER BY name');
    const data = result.rows.map(s => ({ id: s.id, name: s.name, census_code: s.census_code }));
    await redis.setex(cacheKey, 86400, JSON.stringify(data));

    const response = NextResponse.json(data);
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error) {
    console.error('States error:', error);
    return jsonError('Failed to fetch states');
  }
}
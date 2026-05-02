import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redis from '@/lib/redis';
import { withApiAuth, ApiAuthContext } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stateId: string }> }
) {
  return withApiAuth(req, async (request, context) => {
    return handleGetDistricts(request, params, context);
  });
}

async function handleGetDistricts(
  req: NextRequest,
  params: Promise<{ stateId: string }>,
  context: ApiAuthContext
) {
  const { stateId } = await params;
  const cacheKey = `districts:${stateId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(JSON.parse(cached));
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const result = await pool.query(
      'SELECT id, name, census_code FROM districts WHERE state_id = $1 ORDER BY name',
      [stateId]
    );
    const data = result.rows.map(d => ({ id: d.id, name: d.name, census_code: d.census_code }));
    await redis.setex(cacheKey, 86400, JSON.stringify(data));
    const response = NextResponse.json(data);
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error) {
    console.error('Districts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
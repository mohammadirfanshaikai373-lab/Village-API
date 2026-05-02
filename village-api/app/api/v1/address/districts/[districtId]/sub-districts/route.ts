import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redis from '@/lib/redis';
import { withApiAuth, ApiAuthContext } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ districtId: string }> }
) {
  return withApiAuth(req, async (request, context) => {
    return handleGetSubDistricts(request, params, context);
  });
}

async function handleGetSubDistricts(
  req: NextRequest,
  params: Promise<{ districtId: string }>,
  context: ApiAuthContext
) {
  const { districtId } = await params;
  const cacheKey = `sub_districts:${districtId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(JSON.parse(cached));
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const result = await pool.query(
      'SELECT id, name, census_code FROM sub_districts WHERE district_id = $1 ORDER BY name',
      [districtId]
    );
    const data = result.rows.map(sd => ({ id: sd.id, name: sd.name, census_code: sd.census_code }));
    await redis.setex(cacheKey, 86400, JSON.stringify(data));
    const response = NextResponse.json(data);
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error) {
    console.error('Sub-districts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
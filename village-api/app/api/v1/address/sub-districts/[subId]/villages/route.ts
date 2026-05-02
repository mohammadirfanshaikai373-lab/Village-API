import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redis from '@/lib/redis';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subId: string }> }
) {
  const { subId } = await params;
  const cacheKey = `villages:${subId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));

    const result = await pool.query(
      'SELECT id, name, census_code FROM villages WHERE sub_district_id = $1 ORDER BY name',
      [subId]
    );
    const data = result.rows.map(v => ({ id: v.id, name: v.name, census_code: v.census_code }));
    await redis.setex(cacheKey, 86400, JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Villages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
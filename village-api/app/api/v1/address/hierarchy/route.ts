import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import redis from '@/lib/redis';
import { withApiAuth, ApiAuthContext } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  return withApiAuth(req, async (request, context) => {
    return handleHierarchy(request, context);
  });
}

async function handleHierarchy(req: NextRequest, context: ApiAuthContext) {
  const villageId = req.nextUrl.searchParams.get('village_id');
  if (!villageId || isNaN(Number(villageId))) {
    return NextResponse.json({ error: 'Valid village_id is required' }, { status: 400 });
  }

  const cacheKey = `hierarchy:${villageId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));

    const result = await pool.query(
      `SELECT v.name AS village, v.census_code AS village_code,
              sd.name AS sub_district, sd.census_code AS sub_district_code,
              d.name AS district, d.census_code AS district_code,
              s.name AS state, s.census_code AS state_code
       FROM villages v
       JOIN sub_districts sd ON v.sub_district_id = sd.id
       JOIN districts d ON sd.district_id = d.id
       JOIN states s ON d.state_id = s.id
       WHERE v.id = $1
         AND v.census_code <> '000000'
         AND sd.census_code <> '00000'
         AND d.census_code <> '000'`,
      [Number(villageId)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Village not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const data = {
      area_name: row.village,
      sub_district: row.sub_district,
      district: row.district,
      state: row.state,
      country: 'India',
      census_codes: {
        village: row.village_code,
        sub_district: row.sub_district_code,
        district: row.district_code,
        state: row.state_code
      }
    };

    await redis.setex(cacheKey, 3600, JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Hierarchy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
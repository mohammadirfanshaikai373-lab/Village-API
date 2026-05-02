import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  return handleSearch(req);
}

async function handleSearch(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const result = await pool.query(
      `SELECT v.id AS village_id, v.name AS area_name,
              sd.name AS sub_district,
              d.name AS district,
              s.name AS state,
              'India' AS country
       FROM villages v
       JOIN sub_districts sd ON v.sub_district_id = sd.id
       JOIN districts d ON sd.district_id = d.id
       JOIN states s ON d.state_id = s.id
       WHERE v.name ILIKE $1
       ORDER BY v.name
       LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );

    return NextResponse.json({
      results: result.rows,
      limit,
      offset,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
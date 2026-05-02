// app/api/v1/address/autocomplete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withApiAuth, ApiAuthContext } from '@/lib/api-auth';

// ---------- CORS helpers (exactly like the ones we used in user‑profile) ----------
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

function corsHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', ORIGIN);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

function addCorsHeaders(response: NextResponse): NextResponse {
  corsHeaders().forEach((value, key) => response.headers.set(key, value));
  return response;
}

// ---------- OPTIONS handler for CORS preflight ----------
export async function OPTIONS() {
  return addCorsHeaders(
    new NextResponse(null, { status: 204, headers: corsHeaders() })
  );
}

// ---------- Existing GET handler (unchanged except for CORS wrapping) ----------
export async function GET(req: NextRequest) {
  return withApiAuth(req, async (request, context) => {
    const result = await handleAutocomplete(request, context);
    return addCorsHeaders(result);
  });
}

async function handleAutocomplete(req: NextRequest, context: ApiAuthContext) {
  const q = req.nextUrl.searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return addCorsHeaders(
      NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    );
  }

  const clean = q.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  if (!clean) {
    return addCorsHeaders(NextResponse.json([], { status: 200 }));
  }

  const tsquery = clean
    .split(/\s+/)
    .filter(Boolean)
    .map(word => `${word}:*`)
    .join(' & ');

  try {
    const result = await pool.query(
      `SELECT v.name AS village,
              sd.name AS sub_district,
              d.name AS district,
              s.name AS state
       FROM villages v
       JOIN sub_districts sd ON v.sub_district_id = sd.id
       JOIN districts d    ON sd.district_id    = d.id
       JOIN states s       ON d.state_id        = s.id
       WHERE v.name_tsv @@ to_tsquery('simple', $1)
       LIMIT 20`,
      [tsquery]
    );

    const suggestions = result.rows.map(row => ({
      area_name: row.village,
      sub_district: row.sub_district,
      district: row.district,
      state: row.state,
      country: 'India'
    }));

    return addCorsHeaders(NextResponse.json(suggestions));
  } catch (error) {
    console.error('Autocomplete error:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}
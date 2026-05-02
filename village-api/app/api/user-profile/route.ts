import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import pool from '@/lib/db';

// ---------------------------------------------------------------------------
// CORS helper – same as for the auth routes
// ---------------------------------------------------------------------------
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

function corsHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', ORIGIN);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

function addCorsHeaders(response: NextResponse): NextResponse {
  corsHeaders().forEach((value, key) => response.headers.set(key, value));
  return response;
}

// ---------------------------------------------------------------------------
// OPTIONS – preflight
// ---------------------------------------------------------------------------
export async function OPTIONS() {
  return addCorsHeaders(
    new NextResponse(null, { status: 204, headers: corsHeaders() })
  );
}

// ---------------------------------------------------------------------------
// GET /api/user-profile (existing logic, only CORS added)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const userId = session.user.id;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              COALESCE(json_agg(json_build_object(
                'id', ak.id,
                'api_key', ak.api_key,
                'plan', ak.plan,
                'created_at', ak.created_at
              )) FILTER (WHERE ak.id IS NOT NULL), '[]'::json) as api_keys
       FROM users u
       LEFT JOIN api_keys ak ON u.id = ak.user_id
       WHERE u.id = $1
       GROUP BY u.id, u.name, u.email, u.role, u.created_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      return addCorsHeaders(
        NextResponse.json({ error: 'User not found' }, { status: 404 })
      );
    }

    const user = result.rows[0];

    return addCorsHeaders(
      NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        api_keys: user.api_keys || [],
      })
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/user-profile (existing logic, CORS added)
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { name, email } = await req.json();
    const userId = session.user.id;

    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, name, email, role',
      [name || null, email || null, userId]
    );

    if (result.rows.length === 0) {
      return addCorsHeaders(
        NextResponse.json({ error: 'User not found' }, { status: 404 })
      );
    }

    return addCorsHeaders(
      NextResponse.json(result.rows[0])
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    );
  }
}
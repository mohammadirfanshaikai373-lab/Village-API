// Admin API to manage API keys for B2B clients
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// Middleware to verify admin access (you can enhance with JWT)
async function requireAdmin(req: NextRequest) {
  const adminToken = req.headers.get('X-Admin-Token');
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { authorized: true };
}

/**
 * GET /api/admin/api-keys - List all API keys
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const result = await pool.query(
      `SELECT ak.id, ak.api_key, ak.plan, ak.is_active, ak.created_at, ak.last_used_at, u.email, u.name
       FROM api_keys ak
       JOIN users u ON ak.user_id = u.id
       ORDER BY ak.created_at DESC`
    );

    return NextResponse.json({
      count: result.rows.length,
      keys: result.rows.map(k => ({
        id: k.id,
        apiKey: k.api_key.substring(0, 8) + '...',
        fullKey: k.api_key, // Include full key for admin
        plan: k.plan,
        isActive: k.is_active,
        client: { name: k.name, email: k.email },
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at
      }))
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

/**
 * POST /api/admin/api-keys - Create a new API key
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { userId, plan = 'free' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Generate unique API key
    const apiKey = `village_${crypto.randomBytes(32).toString('hex')}`;

    const result = await pool.query(
      `INSERT INTO api_keys (user_id, api_key, plan, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, api_key, plan, created_at`,
      [userId, apiKey, plan]
    );

    return NextResponse.json(
      {
        id: result.rows[0].id,
        apiKey: result.rows[0].api_key,
        plan: result.rows[0].plan,
        createdAt: result.rows[0].created_at,
        message: 'API key created successfully. Store it securely as it cannot be retrieved again.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

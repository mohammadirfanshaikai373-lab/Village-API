// B2B clients can manage their own API keys through auth
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateApiKey } from '@/lib/api-auth';
import crypto from 'crypto';

/**
 * GET /api/v1/api-keys - List user's own API keys
 */
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id, api_key, plan, is_active, created_at, last_used_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [auth.context!.userId]
    );

    return NextResponse.json({
      apiKeys: result.rows.map(k => ({
        id: k.id,
        apiKey: k.api_key.substring(0, 8) + '...',
        plan: k.plan,
        isActive: k.is_active,
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
 * POST /api/v1/api-keys - Create a new API key for the user
 */
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    // Generate unique API key
    const apiKey = `village_${crypto.randomBytes(32).toString('hex')}`;

    const result = await pool.query(
      `INSERT INTO api_keys (user_id, api_key, plan, is_active)
       VALUES ($1, $2, (SELECT plan FROM api_keys WHERE user_id = $1 LIMIT 1), true)
       RETURNING id, api_key, plan, created_at`,
      [auth.context!.userId, apiKey]
    );

    return NextResponse.json(
      {
        id: result.rows[0].id,
        apiKey: result.rows[0].api_key,
        plan: result.rows[0].plan,
        createdAt: result.rows[0].created_at,
        message: 'API key created. Store it securely - you cannot view it again!'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/api-keys/[id] - Revoke an API key
 */
export async function DELETE(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const keyId = req.nextUrl.pathname.split('/').pop();
    
    // Verify ownership
    const result = await pool.query(
      `UPDATE api_keys 
       SET is_active = false
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [keyId, auth.context!.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}

// API Key Validation - B2B Security
import pool from '@/lib/db';
import crypto from 'crypto';

export interface APIKeyData {
  id: string;
  key: string;
  secret: string;
  companyName: string;
  plan: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  isActive: boolean;
  createdAt: Date;
}

export async function validateAPIKey(
  apiKey: string,
  apiSecret: string
): Promise<APIKeyData | null> {
  if (!apiKey || !apiSecret) return null;

  try {
    const result = await pool.query(
      `SELECT id, api_key, api_secret, company_name, plan, rate_limit, is_active, created_at 
       FROM api_keys 
       WHERE api_key = $1 AND is_active = true`,
      [apiKey]
    );

    if (result.rows.length === 0) return null;

    const keyData = result.rows[0];
    const secretHash = crypto
      .createHash('sha256')
      .update(apiSecret)
      .digest('hex');

    if (secretHash !== keyData.api_secret) return null;

    return {
      id: keyData.id,
      key: keyData.api_key,
      secret: keyData.api_secret,
      companyName: keyData.company_name,
      plan: keyData.plan,
      rateLimit: keyData.rate_limit,
      isActive: keyData.is_active,
      createdAt: keyData.created_at,
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

export function generateAPIKeyPair(): { key: string; secret: string } {
  const key = `village_${crypto.randomBytes(24).toString('hex')}`;
  const secret = crypto.randomBytes(32).toString('hex');
  return { key, secret };
}

export function hashAPISecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

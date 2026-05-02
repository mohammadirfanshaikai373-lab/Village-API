// lib/api-utils.ts
import pool from "@/lib/db";
import { randomBytes } from "crypto";

export async function generateApiKey(userId: string) {
  const key = "ak_" + randomBytes(24).toString("hex");
  await pool.query(
    `INSERT INTO api_keys (user_id, api_key, plan) VALUES ($1, $2, 'free')
     ON CONFLICT (user_id) DO UPDATE SET api_key = EXCLUDED.api_key`,
    [userId, key]
  );
  return key;
}
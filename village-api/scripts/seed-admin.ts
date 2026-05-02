// scripts/seed-admin.ts
import { config } from 'dotenv';
config({ path: '.env.local' });   // must be before any pg import

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seedAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const hashed = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    ['Admin', email, hashed]
  );

  console.log('✅ Admin user seeded successfully');
  await pool.end();
}

seedAdmin().catch(console.error);
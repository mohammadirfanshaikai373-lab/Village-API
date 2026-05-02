import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { uid, email, companyName } = req.body;
      if (!uid || !email) return res.status(400).json({ error: 'uid and email required' });

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: uid, email, company_name: companyName || 'My Organization', role: 'user', plan_id: 1, is_active: true });
      if (profileError) throw profileError;

      // Generate API key
      const keyPrefix = 'vill_live_';
      const keyRandom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const apiKey = keyPrefix + keyRandom;

      const { error: keyError } = await supabase
        .from('api_keys')
        .insert({ user_id: uid, key_value: apiKey, key_prefix: apiKey.slice(0, 12), is_active: true });
      if (keyError) throw keyError;

      // Audit log
      await supabase.from('audit_logs').insert({ user_id: uid, action: 'account_created', details: `Account created for ${email}` });

      return res.status(201).json({ ok: true, apiKey });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
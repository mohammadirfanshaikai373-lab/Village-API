import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

      // Deactivate old keys
      await supabase.from('api_keys').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true);

      // Generate new key
      const keyRandom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const apiKey = 'vill_live_' + keyRandom;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({ user_id: user.id, key_value: apiKey, key_prefix: apiKey.slice(0, 12), is_active: true })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'key_regenerated', details: 'API key regenerated' });

      return res.status(201).json({ apiKey: data.key_value });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

      // Get profile
      const { data: profile } = await supabase.from('profiles').select('plan_id').eq('id', user.id).single();

      // Get active API key
      const { data: apiKeyRow } = await supabase.from('api_keys').select('key_value, key_prefix, is_active, created_at').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();

      // Get plan
      const planId = profile?.plan_id || 1;
      const { data: plan } = await supabase.from('plans').select('name, monthly_limit').eq('id', planId).single();

      // Today's usage
      const today = new Date().toISOString().split('T')[0];
      const { count: todayUsage } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today);

      return res.status(200).json({
        apiKey: apiKeyRow?.key_value || null,
        keyPrefix: apiKeyRow?.key_prefix || null,
        keyActive: apiKeyRow?.is_active || false,
        keyCreated: apiKeyRow?.created_at || null,
        plan: plan?.name || 'Explorer',
        planId,
        limit: plan?.monthly_limit || 1000,
        todayUsage: todayUsage || 0,
      });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
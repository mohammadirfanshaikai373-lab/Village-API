import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

      // Sparkline: last 7 days usage
      const sparkline = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en', { weekday: 'short' });
        const { count } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayStr).lt('created_at', new Date(d.getTime() + 86400000).toISOString().split('T')[0]);
        sparkline.push({ day: dayName, calls: count || 0 });
      }

      // Endpoint distribution
      const { data: logs } = await supabase.from('usage_logs').select('endpoint').eq('user_id', user.id).limit(200);
      const epMap = {};
      (logs || []).forEach(l => { epMap[l.endpoint] = (epMap[l.endpoint] || 0) + 1; });
      const endpoints = Object.entries(epMap).map(([name, value]) => ({ name, value }));

      return res.status(200).json({ sparkline, endpoints });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
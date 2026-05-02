import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, details, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Enrich with user emails
      const enriched = await Promise.all((data || []).map(async (l) => {
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', l.user_id).single();
        return { ...l, user_email: profile?.email || null };
      }));

      return res.status(200).json(enriched);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
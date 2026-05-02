import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, company_name, role, plan_id, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with plan names
      const { data: plans } = await supabase.from('plans').select('id, name');
      const planMap = Object.fromEntries((plans || []).map(p => [p.id, p.name]));

      const enriched = (data || []).map(c => ({ ...c, plan_name: planMap[c.plan_id] || 'Explorer' }));
      return res.status(200).json(enriched);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Total clients
      const { count: totalClients } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      // Total villages
      const { count: totalVillages } = await supabase.from('villages').select('*', { count: 'exact', head: true });

      // Today's calls
      const today = new Date().toISOString().split('T')[0];
      const { count: callsToday } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', today);

      // Avg latency
      const { data: latencyData } = await supabase.from('usage_logs').select('response_time_ms').gte('created_at', today).limit(100);
      const avgLatency = latencyData?.length ? Math.round(latencyData.reduce((a, b) => a + (b.response_time_ms || 0), 0) / latencyData.length) : 0;

      // Endpoint distribution
      const { data: endpointData } = await supabase.from('usage_logs').select('endpoint').gte('created_at', today);
       const endpointMap = {};
      (endpointData || []).forEach(e => { endpointMap[e.endpoint] = (endpointMap[e.endpoint] || 0) + 1; });
      const endpoints = Object.entries(endpointMap).map(([name, calls]) => ({ name, calls }));

      return res.status(200).json({
        totalClients: totalClients || 0,
        totalVillages: totalVillages || 0,
        callsToday: callsToday || 0,
        avgLatency,
        endpoints,
      });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
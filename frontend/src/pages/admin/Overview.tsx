import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Globe, Zap, BarChart3, Map } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import supabase from '../../lib/supabase';
import IndiaHeatmap from '../../components/IndiaHeatmap';
import PageTransition from '../../components/PageTransition';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>({});
  const [stateData, setStateData] = useState<{ state: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { count: totalClients } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: totalVillages } = await supabase.from('villages').select('*', { count: 'exact', head: true });
        const today = new Date().toISOString().split('T')[0];
        const { count: callsToday } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', today);
        const { data: latencyData } = await supabase.from('usage_logs').select('response_time_ms').gte('created_at', today).limit(100);
        const avgLatency = latencyData?.length ? Math.round(latencyData.reduce((a: number, b: any) => a + (b.response_time_ms || 0), 0) / latencyData.length) : 0;
        const { data: endpointData } = await supabase.from('usage_logs').select('endpoint').gte('created_at', today);
        const epMap: Record<string, number> = {};
        (endpointData || []).forEach((e: any) => { epMap[e.endpoint] = (epMap[e.endpoint] || 0) + 1; });
        const endpoints = Object.entries(epMap).map(([name, calls]) => ({ name, calls }));
        setStats({ totalClients: totalClients || 0, totalVillages: totalVillages || 0, callsToday: callsToday || 0, avgLatency, endpoints });

        const { data: states } = await supabase.from('state_stats').select('state_name, village_count').order('village_count', { ascending: false });
        setStateData((states || []).map(s => ({ state: s.state_name, count: s.village_count })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary dark:border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Total Clients', value: stats.totalClients, color: 'text-primary dark:text-teal' },
    { icon: Activity, label: 'API Calls Today', value: stats.callsToday, color: 'text-teal' },
    { icon: Globe, label: 'Total Villages', value: stats.totalVillages, color: 'text-primary dark:text-teal' },
    { icon: Zap, label: 'Avg Latency', value: `${stats.avgLatency}ms`, color: 'text-teal' },
  ];

  const endpointData = stats.endpoints?.length > 0 ? stats.endpoints : [
    { name: 'autocomplete', calls: 12500 }, { name: 'hierarchy', calls: 8200 },
    { name: 'search', calls: 6100 }, { name: 'states', calls: 3400 }, { name: 'districts', calls: 2800 },
  ];

  return (
    <PageTransition>
      <div className="p-8 max-w-6xl">
        <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream mb-6">Admin Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={i} className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <s.icon size={20} strokeWidth={1.5} className={`${s.color} mb-2`} />
              <div className="font-heading text-2xl font-bold text-ink dark:text-cream">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
              <div className="text-xs text-faded dark:text-ash font-body mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} strokeWidth={1.5} className="text-primary dark:text-teal" />
              <h3 className="font-heading font-semibold text-ink dark:text-cream">Endpoint Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={endpointData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E0D5' }} />
                <Bar dataKey="calls" fill="#0F3D3E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-4">
              <Map size={16} strokeWidth={1.5} className="text-primary dark:text-teal" />
              <h3 className="font-heading font-semibold text-ink dark:text-cream">Village Coverage</h3>
            </div>
            <IndiaHeatmap data={stateData} height={250} />
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

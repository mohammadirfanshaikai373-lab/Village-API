import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieIcon, Map } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../lib/auth';
import supabase from '../../lib/supabase';
import IndiaHeatmap from '../../components/IndiaHeatmap';
import PageTransition from '../../components/PageTransition';

const PIE_COLORS = ['#0F3D3E', '#2DD4A8', '#D94F4F', '#6B6560', '#E5E0D5'];

export default function Usage() {
  const { user } = useAuth();
  const [stateData, setStateData] = useState<{ state: string; count: number }[]>([]);
  const [sparkData, setSparkData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // State data for heatmap
        const { data: states } = await supabase.from('state_stats').select('state_name, village_count').order('village_count', { ascending: false });
        setStateData((states || []).map(s => ({ state: s.state_name, count: s.village_count })));

        if (user) {
          // Sparkline: last 7 days
          const sparkline = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const nextDay = new Date(d.getTime() + 86400000).toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en', { weekday: 'short' });
            const { count } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayStr).lt('created_at', nextDay);
            sparkline.push({ day: dayName, calls: count || 0 });
          }
          setSparkData(sparkline);

          // Endpoint distribution
          const { data: logs } = await supabase.from('usage_logs').select('endpoint').eq('user_id', user.id).limit(200);
          const epMap: Record<string, number> = {};
          (logs || []).forEach(l => { epMap[l.endpoint] = (epMap[l.endpoint] || 0) + 1; });
          setPieData(Object.entries(epMap).map(([name, value]) => ({ name, value })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary dark:border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const defaultSpark = [
    { day: 'Mon', calls: 120 }, { day: 'Tue', calls: 180 }, { day: 'Wed', calls: 90 },
    { day: 'Thu', calls: 250 }, { day: 'Fri', calls: 310 }, { day: 'Sat', calls: 150 }, { day: 'Sun', calls: 80 },
  ];
  const defaultPie = [
    { name: 'autocomplete', value: 45 }, { name: 'hierarchy', value: 25 },
    { name: 'search', value: 20 }, { name: 'states', value: 10 },
  ];

  return (
    <PageTransition>
      <div className="p-8 max-w-6xl">
        <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream mb-6">Usage Analytics</h1>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} strokeWidth={1.5} className="text-primary dark:text-teal" />
              <h3 className="font-heading font-semibold text-ink dark:text-cream">Daily Usage</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sparkData.length > 0 ? sparkData : defaultSpark}>
                <defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2DD4A8" stopOpacity={0.3} /><stop offset="100%" stopColor="#2DD4A8" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E0D5' }} />
                <Area type="monotone" dataKey="calls" stroke="#2DD4A8" strokeWidth={2} fill="url(#sparkGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
          <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <PieIcon size={16} strokeWidth={1.5} className="text-primary dark:text-teal" />
              <h3 className="font-heading font-semibold text-ink dark:text-cream">Endpoint Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData.length > 0 ? pieData : defaultPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {(pieData.length > 0 ? pieData : defaultPie).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E0D5' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {(pieData.length > 0 ? pieData : defaultPie).map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-faded dark:text-ash">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-4">
            <Map size={16} strokeWidth={1.5} className="text-primary dark:text-teal" />
            <h3 className="font-heading font-semibold text-ink dark:text-cream">Coverage Map</h3>
          </div>
          <IndiaHeatmap data={stateData} height={350} />
        </motion.div>
      </div>
    </PageTransition>
  );
}

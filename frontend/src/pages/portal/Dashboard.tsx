import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Clock, Activity } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import supabase from '../../lib/supabase';
import VillageCompass from '../../components/VillageCompass';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [planName, setPlanName] = useState('Explorer');
  const [limit, setLimit] = useState(1000);
  const [todayUsage, setTodayUsage] = useState(0);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // Get active API key
        const { data: keyData } = await supabase.from('api_keys').select('key_value, key_prefix, is_active, created_at').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1);
        if (keyData && keyData.length > 0) setApiKey(keyData[0].key_value);

        // Get plan
        const planId = profile?.plan_id || 1;
        const { data: planData } = await supabase.from('plans').select('name, monthly_limit').eq('id', planId).single();
        if (planData) { setPlanName(planData.name); setLimit(planData.monthly_limit); }

        // Today's usage
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today);
        setTodayUsage(count || 0);

        // Recent calls
        const { data: logs } = await supabase.from('usage_logs').select('id, endpoint, status_code, response_time_ms, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
        setCalls(logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, profile]);

  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maskedKey = apiKey ? apiKey.slice(0, 12) + '••••••••' + apiKey.slice(-4) : '—';

  const callColumns = [
    { key: 'endpoint', label: 'Endpoint', sortable: true, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { key: 'status_code', label: 'Status', sortable: true, render: (v: number) => (
      <span className={`font-mono text-xs ${v < 300 ? 'text-teal' : 'text-accent dark:text-coral'}`}>{v}</span>
    )},
    { key: 'response_time_ms', label: 'Latency', sortable: true, render: (v: number) => <span className="font-mono text-xs">{v}ms</span> },
    { key: 'created_at', label: 'Time', sortable: true, render: (v: string) => <span className="text-xs text-faded dark:text-ash">{new Date(v).toLocaleTimeString()}</span> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary dark:border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-6xl">
        <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream mb-6">Dashboard</h1>
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6 flex flex-col items-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <VillageCompass usage={todayUsage} limit={limit} label="Today's Calls" size={200} />
          </motion.div>
          <motion.div className="lg:col-span-2 bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} strokeWidth={1.5} className="text-primary dark:text-teal" />
              <h3 className="font-heading font-semibold text-ink dark:text-cream">API Key</h3>
            </div>
            <div className="bg-parchment dark:bg-void rounded-lg p-3 flex items-center gap-2 mb-4 border border-dashed border-rule dark:border-rule-dark">
              <span className="font-mono text-sm text-ink dark:text-cream flex-1 truncate">{maskedKey}</span>
              <button onClick={handleCopyKey} className="p-1.5 rounded-md hover:bg-rule dark:hover:bg-rule-dark transition-colors text-faded dark:text-ash">
                {copied ? <Check size={14} strokeWidth={1.5} className="text-teal" /> : <Copy size={14} strokeWidth={1.5} />}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="font-heading text-2xl font-bold text-ink dark:text-cream">{todayUsage}</div>
                <div className="text-xs text-faded dark:text-ash">Today</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-2xl font-bold text-primary dark:text-teal">{planName}</div>
                <div className="text-xs text-faded dark:text-ash">Plan</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-2xl font-bold text-ink dark:text-cream">{limit.toLocaleString()}</div>
                <div className="text-xs text-faded dark:text-ash">Limit</div>
              </div>
            </div>
          </motion.div>
        </div>
        <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} strokeWidth={1.5} className="text-primary dark:text-teal" />
            <h3 className="font-heading font-semibold text-ink dark:text-cream">Recent API Calls</h3>
          </div>
          <DataTable columns={callColumns} data={calls} searchPlaceholder="Filter calls…" searchKeys={['endpoint']} />
        </motion.div>
      </div>
    </PageTransition>
  );
}

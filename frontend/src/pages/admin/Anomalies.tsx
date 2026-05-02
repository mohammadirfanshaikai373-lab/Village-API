import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import supabase from '../../lib/supabase';
import DataTable from '../../components/DataTable';
import AnomalyBadge from '../../components/AnomalyBadge';
import PageTransition from '../../components/PageTransition';

export default function AdminAnomalies() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('anomalies').select('id, type, description, severity, is_resolved, created_at, user_id').order('created_at', { ascending: false }).limit(50);
        // Enrich with user emails
        const enriched = await Promise.all((data || []).map(async (a: any) => {
          if (a.user_id) {
            const { data: profile } = await supabase.from('profiles').select('email').eq('id', a.user_id).single();
            return { ...a, user_email: profile?.email || null };
          }
          return { ...a, user_email: null };
        }));
        setAnomalies(enriched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { key: 'severity', label: 'Severity', sortable: true, render: (v: string) => <AnomalyBadge severity={v as any} /> },
    { key: 'type', label: 'Type', sortable: true, render: (v: string) => <span className="font-heading font-semibold text-sm">{v}</span> },
    { key: 'description', label: 'Description', render: (v: string) => <span className="text-sm text-faded dark:text-ash">{v}</span> },
    { key: 'user_email', label: 'Client', sortable: true, render: (v: string) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'is_resolved', label: 'Resolved', render: (v: boolean) => (
      <span className={`text-xs font-heading font-semibold ${v ? 'text-teal' : 'text-accent dark:text-coral'}`}>{v ? 'Yes' : 'No'}</span>
    )},
    { key: 'created_at', label: 'Detected', sortable: true, render: (v: string) => <span className="text-xs text-faded dark:text-ash">{new Date(v).toLocaleString()}</span> },
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
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle size={20} strokeWidth={1.5} className="text-accent dark:text-coral" />
          <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream">Anomalies</h1>
        </div>
        <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <DataTable columns={columns} data={anomalies} searchPlaceholder="Filter anomalies…" searchKeys={['type', 'description', 'user_email']} />
        </motion.div>
      </div>
    </PageTransition>
  );
}

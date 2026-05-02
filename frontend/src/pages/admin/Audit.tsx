import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText } from 'lucide-react';
import supabase from '../../lib/supabase';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.from('audit_logs').select('id, user_id, action, details, created_at').order('created_at', { ascending: false }).limit(50);
        const enriched = await Promise.all((data || []).map(async (l: any) => {
          if (l.user_id) {
            const { data: profile } = await supabase.from('profiles').select('email').eq('id', l.user_id).single();
            return { ...l, user_email: profile?.email || null };
          }
          return { ...l, user_email: null };
        }));
        setLogs(enriched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { key: 'action', label: 'Action', sortable: true, render: (v: string) => <span className="font-heading font-semibold text-sm text-ink dark:text-cream">{v}</span> },
    { key: 'user_email', label: 'User', sortable: true, render: (v: string) => <span className="font-mono text-xs">{v || 'System'}</span> },
    { key: 'details', label: 'Details', render: (v: string) => <span className="text-sm text-faded dark:text-ash max-w-xs truncate block">{v}</span> },
    { key: 'created_at', label: 'Timestamp', sortable: true, render: (v: string) => <span className="text-xs text-faded dark:text-ash font-mono">{new Date(v).toLocaleString()}</span> },
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
          <ScrollText size={20} strokeWidth={1.5} className="text-primary dark:text-teal" />
          <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream">Audit Log</h1>
        </div>
        <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <DataTable columns={columns} data={logs} searchPlaceholder="Search logs…" searchKeys={['action', 'details', 'user_email']} />
        </motion.div>
      </div>
    </PageTransition>
  );
}

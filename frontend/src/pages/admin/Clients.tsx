import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ToggleLeft, ToggleRight, Mail, Building2 } from 'lucide-react';
import supabase from '../../lib/supabase';
import DataTable from '../../components/DataTable';
import PageTransition from '../../components/PageTransition';

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, email, company_name, role, plan_id, is_active, created_at').order('created_at', { ascending: false });
      const { data: plans } = await supabase.from('plans').select('id, name');
      const planMap = Object.fromEntries((plans || []).map((p: any) => [p.id, p.name]));
      const enriched = (profiles || []).map(c => ({ ...c, plan_name: planMap[c.plan_id] || 'Explorer' }));
      setClients(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleToggle = async (userId: string, currentActive: boolean) => {
    await supabase.from('profiles').update({ is_active: !currentActive }).eq('id', userId);
    await supabase.from('audit_logs').insert({ user_id: userId, action: !currentActive ? 'client_activated' : 'client_suspended', details: `Client ${!currentActive ? 'activated' : 'suspended'}` });
    fetchClients();
  };

  const columns = [
    { key: 'email', label: 'Email', sortable: true, render: (v: string) => (
      <div className="flex items-center gap-2"><Mail size={14} strokeWidth={1.5} className="text-faded dark:text-ash" /><span className="font-mono text-xs">{v}</span></div>
    )},
    { key: 'company_name', label: 'Organization', sortable: true, render: (v: string) => (
      <div className="flex items-center gap-2"><Building2 size={14} strokeWidth={1.5} className="text-faded dark:text-ash" /><span className="text-sm">{v}</span></div>
    )},
    { key: 'plan_name', label: 'Plan', sortable: true },
    { key: 'is_active', label: 'Status', render: (v: boolean, row: any) => (
      <button onClick={(e) => { e.stopPropagation(); handleToggle(row.id, v); }} className="flex items-center gap-1">
        {v ? <ToggleRight size={20} strokeWidth={1.5} className="text-teal" /> : <ToggleLeft size={20} strokeWidth={1.5} className="text-accent dark:text-coral" />}
        <span className={`text-xs ${v ? 'text-teal' : 'text-accent dark:text-coral'}`}>{v ? 'Active' : 'Suspended'}</span>
      </button>
    )},
    { key: 'created_at', label: 'Joined', sortable: true, render: (v: string) => <span className="text-xs text-faded dark:text-ash">{new Date(v).toLocaleDateString()}</span> },
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
          <Users size={20} strokeWidth={1.5} className="text-primary dark:text-teal" />
          <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream">Clients</h1>
        </div>
        <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <DataTable columns={columns} data={clients} searchPlaceholder="Search clients…" searchKeys={['email', 'company_name']}
            expandRow={(row) => (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-faded dark:text-ash">User ID:</span> <span className="font-mono text-xs">{row.id}</span></div>
                <div><span className="text-faded dark:text-ash">Plan ID:</span> <span className="font-mono text-xs">{row.plan_id}</span></div>
                <div><span className="text-faded dark:text-ash">Role:</span> {row.role}</div>
                <div><span className="text-faded dark:text-ash">Status:</span> {row.is_active ? 'Active' : 'Suspended'}</div>
              </div>
            )}
          />
        </motion.div>
      </div>
    </PageTransition>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import supabase from '../../lib/supabase';
import PricingCard from '../../components/PricingCard';
import PageTransition from '../../components/PageTransition';

export default function Plan() {
  const { profile, refreshProfile } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('plans').select('*').order('id', { ascending: true })
      .then(({ data }) => { setPlans(data || []); setLoading(false); });
  }, []);

  const handleUpgrade = async (planId: number) => {
    if (!profile) return;
    try {
      await supabase.from('profiles').update({ plan_id: planId }).eq('id', profile.id);
      await supabase.from('audit_logs').insert({ user_id: profile.id, action: 'plan_upgraded', details: `Upgraded to plan ${planId}` });
      refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary dark:border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard size={20} strokeWidth={1.5} className="text-primary dark:text-teal" />
          <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream">Your Plan</h1>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan: any) => (
            <PricingCard key={plan.id} plan={{ ...plan, features: plan.features || [] }} current={profile?.plan_id === plan.id} onUpgrade={handleUpgrade} />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

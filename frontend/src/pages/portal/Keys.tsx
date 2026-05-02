import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key as KeyIcon, RefreshCw, Copy, Check, Shield } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import supabase from '../../lib/supabase';
import KeyRevealModal from '../../components/KeyRevealModal';
import PageTransition from '../../components/PageTransition';

export default function Keys() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [keyCreated, setKeyCreated] = useState('');
  const [keyActive, setKeyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('api_keys').select('key_value, key_prefix, is_active, created_at').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setApiKey(data[0].key_value);
          setKeyCreated(data[0].created_at);
          setKeyActive(data[0].is_active);
        }
        setLoading(false);
      });
  }, [user]);

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (!user) return;
    setRegenerating(true);
    try {
      // Deactivate old keys
      await supabase.from('api_keys').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true);
      // Generate new key
      const keyRandom = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newKeyValue = 'vill_live_' + keyRandom;
      const { data } = await supabase.from('api_keys').insert({ user_id: user.id, key_value: newKeyValue, key_prefix: newKeyValue.slice(0, 12), is_active: true }).select().single();
      if (data) {
        setNewKey(data.key_value);
        setShowKeyModal(true);
        setApiKey(data.key_value);
        setKeyCreated(data.created_at);
      }
      // Audit log
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'key_regenerated', details: 'API key regenerated' });
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  const maskedKey = apiKey ? apiKey.slice(0, 12) + '••••••••' + apiKey.slice(-4) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary dark:border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-3xl">
        <h1 className="font-heading text-2xl font-bold text-ink dark:text-cream mb-6">API Keys</h1>
        <motion.div className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6 mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <KeyIcon size={18} strokeWidth={1.5} className="text-primary dark:text-teal" />
            <h3 className="font-heading font-semibold text-ink dark:text-cream">Active Key</h3>
            {keyActive && (
              <span className="ml-2 flex items-center gap-1 text-xs text-teal font-mono">
                <Shield size={12} strokeWidth={1.5} /> Active
              </span>
            )}
          </div>
          <div className="bg-parchment dark:bg-void rounded-lg p-4 border border-dashed border-rule dark:border-rule-dark mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-ink dark:text-cream flex-1">{maskedKey}</span>
              <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-rule dark:hover:bg-rule-dark transition-colors text-faded dark:text-ash">
                {copied ? <Check size={14} strokeWidth={1.5} className="text-teal" /> : <Copy size={14} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
          <div className="text-xs text-faded dark:text-ash font-body mb-4">
            Created {keyCreated ? new Date(keyCreated).toLocaleDateString() : '—'}
          </div>
          <button onClick={handleRegenerate} disabled={regenerating}
            className="flex items-center gap-2 bg-accent/10 dark:bg-coral/10 text-accent dark:text-coral font-heading font-semibold px-4 py-2 rounded-lg text-sm hover:bg-accent/20 dark:hover:bg-coral/20 transition-colors disabled:opacity-50">
            <RefreshCw size={16} strokeWidth={1.5} className={regenerating ? 'animate-spin' : ''} />
            {regenerating ? 'Regenerating…' : 'Regenerate Key'}
          </button>
        </motion.div>
        <div className="bg-parchment dark:bg-void rounded-xl border border-rule dark:border-rule-dark p-4">
          <p className="text-sm text-faded dark:text-ash font-body">
            <strong className="text-ink dark:text-cream">⚠ Important:</strong> Keep your API key secret. Never expose it in client-side code. If compromised, regenerate immediately.
          </p>
        </div>
      </div>
      <KeyRevealModal open={showKeyModal} apiKey={newKey} onClose={() => setShowKeyModal(false)} />
    </PageTransition>
  );
}

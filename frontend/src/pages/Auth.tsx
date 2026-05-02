import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Mail, Lock, Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signInWithGoogle } from '../lib/googleAuth';
import KeyRevealModal from '../components/KeyRevealModal';
import PageTransition from '../components/PageTransition';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// -------- Login via form submission (no CORS) --------
async function submitLoginForm(email: string, password: string) {
  // 1. Fetch CSRF token from NextAuth
  const csrfRes = await fetch(`${BACKEND_URL}/auth/csrf`, { credentials: 'include' });
  const csrfData = await csrfRes.json().catch(() => ({}));
  const csrfToken = csrfData?.csrfToken || '';

  // 2. Build hidden form and submit
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${BACKEND_URL}/auth/callback/credentials`;
  form.style.display = 'none';

  const addField = (name: string, value: string) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  addField('email', email);
  addField('password', password);
  addField('csrfToken', csrfToken);
  // 🔥 This line ensures the redirect goes to the Vite portal
  addField('callbackUrl', `${FRONTEND_URL}/portal`);

  document.body.appendChild(form);
  form.submit();
}

// -------- Registration: API call + auto sign‑in --------
async function registerAndSignIn(
  email: string,
  password: string,
  companyName: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Register
  const res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name: companyName, email, password, role: 'customer' }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    return { success: false, error: data?.error || `Registration failed (${res.status})` };
  }

  // 2. Auto login – submit the hidden form (full page navigation)
  await submitLoginForm(email, password);
  return { success: true };
}

export default function Auth() {
  const [params] = useSearchParams();
  const isRegister = params.get('mode') === 'register';
  const [mode, setMode] = useState<'login' | 'register'>(isRegister ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Login: submit the form (full page navigation)
        await submitLoginForm(email, password);
        // Page will navigate away – loading indicator disappears automatically
      } else {
        // Registration: first register, then auto‑login
        const result = await registerAndSignIn(email, password, companyName || 'My Organization');
        if (!result.success) {
          setError(result.error || 'Registration failed');
          setLoading(false);
        }
        // If success, page navigates away (no setLoading needed)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-parchment dark:bg-void flex items-center justify-center relative">
        <div className="absolute inset-0 latitude-grid" />
        <motion.div
          className="relative bg-card dark:bg-card-dark rounded-2xl shadow-xl border border-rule dark:border-rule-dark p-8 max-w-md w-full mx-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Compass size={24} strokeWidth={1.5} className="text-primary dark:text-teal" />
            <span className="font-heading font-bold text-lg text-ink dark:text-cream">VillageAPI</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-ink dark:text-cream mb-1">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-faded dark:text-ash font-body mb-6">
            {mode === 'register' ? 'Get your API key and start building.' : 'Sign in to your dashboard.'}
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 bg-accent/10 dark:bg-coral/10 text-accent dark:text-coral text-sm rounded-lg font-body">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <Building2 size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-faded dark:text-ash" />
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Organization name"
                  className="w-full pl-10 pr-4 py-2.5 bg-parchment dark:bg-void border border-rule dark:border-rule-dark rounded-lg text-ink dark:text-cream placeholder:text-faded dark:placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-teal/30 font-body" />
              </div>
            )}
            <div className="relative">
              <Mail size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-faded dark:text-ash" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email address"
                className="w-full pl-10 pr-4 py-2.5 bg-parchment dark:bg-void border border-rule dark:border-rule-dark rounded-lg text-ink dark:text-cream placeholder:text-faded dark:placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-teal/30 font-body" />
            </div>
            <div className="relative">
              <Lock size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-faded dark:text-ash" />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" minLength={6}
                className="w-full pl-10 pr-10 py-2.5 bg-parchment dark:bg-void border border-rule dark:border-rule-dark rounded-lg text-ink dark:text-cream placeholder:text-faded dark:placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-teal/30 font-body" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faded dark:text-ash">
                {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary dark:bg-teal text-white dark:text-void font-heading font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Please wait…' : (mode === 'register' ? 'Create Account' : 'Sign In')} <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-rule dark:bg-rule-dark" />
            <span className="text-xs text-faded dark:text-ash font-body">or</span>
            <div className="flex-1 h-px bg-rule dark:bg-rule-dark" />
          </div>

          <button onClick={() => signInWithGoogle('VillageAPI')}
            className="w-full flex items-center justify-center gap-2 bg-parchment dark:bg-void border border-rule dark:border-rule-dark font-heading font-semibold py-2.5 rounded-lg text-ink dark:text-cream hover:bg-rule/50 dark:hover:bg-rule-dark/50 transition-colors text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>

          <p className="mt-6 text-center text-sm text-faded dark:text-ash font-body">
            {mode === 'register' ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
            <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="text-primary dark:text-teal font-semibold hover:underline">
              {mode === 'register' ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-faded dark:text-ash font-body">
            Demo: <span className="font-mono">demo@villageapi.in</span> / <span className="font-mono">password123</span>
          </p>
        </motion.div>
        <KeyRevealModal open={showKeyModal} apiKey={newApiKey} onClose={() => setShowKeyModal(false)} />
      </div>
    </PageTransition>
  );
}
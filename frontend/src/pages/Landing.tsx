import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, Globe, Zap, Shield, Sun, Moon, ArrowRight, MapPin } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import IndiaHeatmap from '../components/IndiaHeatmap';
import CodeBlock from '../components/CodeBlock';
import PricingCard from '../components/PricingCard';
import CompassRose from '../components/CompassRose';
import PageTransition from '../components/PageTransition';

export default function Landing() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [stateData, setStateData] = useState<{ state: string; count: number }[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Load state stats from your backend (replace with your own stats endpoint if exists, else mock)
  useEffect(() => {
    // This is a placeholder; you can later replace with /api/admin/stats or a backend endpoint.
    setStateData([
      { state: 'Maharashtra', count: 42000 },
      { state: 'Uttar Pradesh', count: 59000 },
      { state: 'Bihar', count: 38000 },
    ]);
    // Plans hardcoded (or fetch from backend)
    setPlans([
      { id: 1, name: 'Explorer', monthly_limit: 1000, price: 0, description: 'Get started with village data', features: ['1,000 API calls/month', 'Autocomplete endpoint', 'Basic hierarchy', 'Community support'] },
      { id: 2, name: 'Surveyor', monthly_limit: 50000, price: 49, description: 'For growing applications', features: ['50,000 API calls/month', 'All endpoints', 'State/District filters', 'Priority support', 'Redis caching'] },
      { id: 3, name: 'Cartographer', monthly_limit: 999999, price: 199, description: 'Enterprise-grade access', features: ['Unlimited API calls', 'All endpoints + bulk', 'Custom SLA', 'Dedicated support', 'On-premise option', 'Webhook events'] },
    ]);
  }, []);

  // Debounced live search using the real API
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${base}/address/autocomplete?q=${encodeURIComponent(query.trim())}`, {
  headers: {
    Authorization: 'Bearer vill_live_demo_key'
  }
});
        const data = await res.json();
        const villages = Array.isArray(data) ? data : [];
        setResults(villages);
        setShowResults(true);
      } catch (err) {
        console.error('Search failed', err);
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-parchment dark:bg-void">
        <nav className="sticky top-0 z-30 bg-card/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-rule dark:border-rule-dark">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={24} strokeWidth={1.5} className="text-primary dark:text-teal" />
              <span className="font-heading font-bold text-lg text-ink dark:text-cream">VillageAPI</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggle} className="p-2 rounded-lg text-faded dark:text-ash hover:bg-parchment dark:hover:bg-void transition-colors">
                {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
              </button>
              {user ? (
                <button onClick={() => navigate('/portal')} className="bg-primary dark:bg-teal text-white dark:text-void font-heading font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                  Dashboard
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/auth" className="text-sm font-body text-faded dark:text-ash hover:text-ink dark:hover:text-cream transition-colors">Sign In</Link>
                  <Link to="/auth?mode=register" className="bg-primary dark:bg-teal text-white dark:text-void font-heading font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                    Get API Key
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 latitude-grid" />
          <div className="absolute top-8 right-8 text-compass dark:text-compass-dark opacity-30">
            <CompassRose size={120} />
          </div>
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-teal/10 text-primary dark:text-teal text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
                    <Globe size={14} strokeWidth={1.5} /> 640K+ Villages Indexed
                  </div>
                  <h1 className="font-heading text-5xl lg:text-6xl font-extrabold text-ink dark:text-cream leading-tight mb-6">
                    India's Village<br />
                    <span className="text-primary dark:text-teal">Data API</span>
                  </h1>
                  <p className="text-lg text-faded dark:text-ash font-body leading-relaxed mb-8 max-w-lg">
                    Sub-10ms Redis-cached access to every village in India. Autocomplete, hierarchy, and geospatial queries — one API call away.
                  </p>
                  <div className="flex items-center gap-4">
                    <Link to="/auth?mode=register" className="flex items-center gap-2 bg-primary dark:bg-teal text-white dark:text-void font-heading font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                      Get Free API Key <ArrowRight size={18} strokeWidth={1.5} />
                    </Link>
                    <a href="#demo" className="flex items-center gap-2 text-primary dark:text-teal font-heading font-semibold px-4 py-3 rounded-lg hover:bg-primary/5 dark:hover:bg-teal/5 transition-colors">
                      <Zap size={18} strokeWidth={1.5} /> Try Live
                    </a>
                  </div>
                </motion.div>
              </div>
              <div className="hidden lg:block">
                <IndiaHeatmap data={stateData} height={380} fadeOnScroll />
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="py-20 bg-card dark:bg-card-dark border-y border-rule dark:border-rule-dark">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="font-heading text-2xl font-bold text-ink dark:text-cream mb-2">Live Village Search</h2>
            <p className="text-faded dark:text-ash font-body mb-6">Start typing to search across 640K+ villages in real-time.</p>
            <div ref={searchRef} className="relative">
              <Search size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-faded dark:text-ash" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search villages… e.g. Moshi"
                className="w-full pl-12 pr-4 py-3.5 bg-parchment dark:bg-void border border-rule dark:border-rule-dark rounded-xl text-ink dark:text-cream placeholder:text-faded dark:placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-teal/30 font-body text-lg"
                onFocus={() => results.length > 0 && setShowResults(true)}
              />
              {showResults && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-xl shadow-xl overflow-hidden z-20">
                  {results.map((r, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-parchment dark:hover:bg-void transition-colors border-b border-dashed border-rule dark:border-rule-dark last:border-0 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} strokeWidth={1.5} className="text-primary dark:text-teal" />
                        <span className="font-body font-medium text-ink dark:text-cream">{r.area_name}</span>
                        <span className="text-xs text-faded dark:text-ash ml-1">{r.sub_district}</span>
                      </div>
                      <div className="text-xs text-faded dark:text-ash ml-6 mt-0.5">{r.district}, {r.state}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-heading text-3xl font-bold text-ink dark:text-cream text-center mb-12">Built for Precision</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: 'Sub-10ms Response', desc: 'Redis-cached layer delivers village data faster than a blink. Every query, every time.' },
                { icon: Globe, title: '640K+ Villages', desc: 'Complete coverage of India\'s administrative hierarchy — states, districts, sub-districts, villages.' },
                { icon: Shield, title: 'Enterprise Auth', desc: 'API key authentication with rate limiting, usage analytics, and anomaly detection built in.' },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card dark:bg-card-dark rounded-xl border border-rule dark:border-rule-dark p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-teal/10 flex items-center justify-center mb-4">
                    <f.icon size={24} strokeWidth={1.5} className="text-primary dark:text-teal" />
                  </div>
                  <h3 className="font-heading font-bold text-ink dark:text-cream mb-2">{f.title}</h3>
                  <p className="text-sm text-faded dark:text-ash font-body leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-card dark:bg-card-dark border-y border-rule dark:border-rule-dark">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="font-heading text-2xl font-bold text-ink dark:text-cream mb-2">One Call. All the Data.</h2>
            <p className="text-faded dark:text-ash font-body mb-6">Get village autocomplete results with a single curl command.</p>
            <CodeBlock
              code={`curl -H "Authorization: Bearer vill_live_demo_key" \\
  "https://api.villageapi.in/api/v1/address/autocomplete?q=rampur"`}
              language="bash"
            />
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-heading text-3xl font-bold text-ink dark:text-cream text-center mb-4">Simple, Transparent Pricing</h2>
            <p className="text-faded dark:text-ash font-body text-center mb-12">Start free. Scale as you grow.</p>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan: any) => (
                <PricingCard key={plan.id} plan={{ ...plan, features: plan.features || [] }} />
              ))}
            </div>
          </div>
        </section>

        <footer className="py-10 border-t border-rule dark:border-rule-dark">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Compass size={18} strokeWidth={1.5} className="text-primary dark:text-teal" />
              <span className="font-heading font-bold text-sm text-ink dark:text-cream">VillageAPI</span>
              <span className="text-xs text-faded dark:text-ash">— India's Village Data Infrastructure</span>
            </div>
            <div className="text-xs text-faded dark:text-ash font-body">© 2024 VillageAPI. Cartographic precision for modern applications.</div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
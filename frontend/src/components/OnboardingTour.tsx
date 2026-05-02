import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Key, Zap, SkipForward, ArrowRight } from 'lucide-react';
import KeyRevealModal from './KeyRevealModal';
import CodeBlock from './CodeBlock';

interface OnboardingTourProps {
  apiKey: string;
  onComplete: () => void;
}

const STEPS = [
  { icon: Building2, title: 'Name Your Organization', desc: 'What should we call your workspace?' },
  { icon: Key, title: 'Generate API Key', desc: 'Your key gives access to 640K+ villages.' },
  { icon: Zap, title: 'Test Your First Call', desc: 'Let\'s make sure everything works.' },
];

export default function OnboardingTour({ apiKey, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleNext = () => {
    if (step === 0 && companyName.trim()) {
      setStep(1);
      setShowKey(true);
    } else if (step === 1) {
      setStep(2);
    } else {
      localStorage.setItem('villageapi-onboarded', '1');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('villageapi-onboarded', '1');
    onComplete();
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-parchment/90 dark:bg-void/90 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-card dark:bg-card-dark rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-rule dark:border-rule-dark"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-primary dark:bg-teal' : i < step ? 'bg-primary/40 dark:bg-teal/40' : 'bg-rule dark:bg-rule-dark'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-teal/10 flex items-center justify-center">
                  {(() => { const Icon = STEPS[step].icon; return <Icon size={20} strokeWidth={1.5} className="text-primary dark:text-teal" />; })()}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-ink dark:text-cream">{STEPS[step].title}</h3>
                  <p className="text-sm text-faded dark:text-ash">{STEPS[step].desc}</p>
                </div>
              </div>

              {step === 0 && (
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-2.5 bg-parchment dark:bg-void border border-rule dark:border-rule-dark rounded-lg text-ink dark:text-cream placeholder:text-faded dark:placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-teal/30 font-body mb-6"
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                  autoFocus
                />
              )}

              {step === 1 && (
                <div className="mb-6">
                  <p className="text-sm text-faded dark:text-ash mb-3">Your API key has been generated. Reveal it below to copy.</p>
                  <button onClick={() => setShowKey(true)} className="text-sm text-primary dark:text-teal underline font-medium">Reveal API Key</button>
                </div>
              )}

              {step === 2 && (
                <div className="mb-6">
                  <CodeBlock
                    code={`curl -H "Authorization: Bearer ${apiKey}" \\
  "https://api.villageapi.in/api/v1/address/autocomplete?q=mumbai"`}
                    language="bash"
                    tryEndpoint="/api/autocomplete?q=mumbai"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <button onClick={handleSkip} className="flex items-center gap-1 text-sm text-faded dark:text-ash hover:text-ink dark:hover:text-cream transition-colors">
              <SkipForward size={14} strokeWidth={1.5} /> Skip
            </button>
            <button
              onClick={handleNext}
              disabled={step === 0 && !companyName.trim()}
              className="flex items-center gap-2 bg-primary dark:bg-teal text-white dark:text-void font-heading font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {step === 2 ? 'Get Started' : 'Continue'} <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      <KeyRevealModal open={showKey && step === 1} apiKey={apiKey} onClose={() => setShowKey(false)} />
    </>
  );
}
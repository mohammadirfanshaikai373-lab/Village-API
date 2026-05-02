import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Copy, Check, X } from 'lucide-react';

interface KeyRevealModalProps {
  open: boolean;
  apiKey: string;
  onClose: () => void;
}

export default function KeyRevealModal({ open, apiKey, onClose }: KeyRevealModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = apiKey ? apiKey.slice(0, 9) + '••••••••' + apiKey.slice(-4) : '';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [apiKey]);

  const handleReveal = () => {
    setRevealed(true);
    handleCopy();
  };

  // Auto-close after 3s of reveal
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [revealed, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) { setRevealed(false); setCopied(false); }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 dark:bg-void/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-card dark:bg-card-dark rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-rule dark:border-rule-dark"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-faded dark:text-ash hover:text-ink dark:hover:text-cream transition-colors">
              <X size={18} strokeWidth={1.5} />
            </button>
            <h3 className="font-heading text-lg font-bold text-ink dark:text-cream mb-1">Your API Key</h3>
            <p className="text-sm text-faded dark:text-ash mb-6">Copy this key now. You won't be able to see it again.</p>
            {/* Perforated paper slip */}
            <div className="perforated-edge bg-parchment dark:bg-void rounded-lg p-4 border border-dashed border-rule dark:border-rule-dark font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="flex-1 break-all text-ink dark:text-cream">
                  {revealed ? apiKey : masked}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-rule dark:hover:bg-rule-dark transition-colors text-faded dark:text-ash"
                  title="Copy"
                >
                  {copied ? <Check size={16} strokeWidth={1.5} className="text-teal" /> : <Copy size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            {!revealed ? (
              <button
                onClick={handleReveal}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-primary dark:bg-teal text-white dark:text-void font-heading font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Eye size={16} strokeWidth={1.5} /> Reveal & Copy
              </button>
            ) : (
              <div className="mt-6 flex items-center justify-center gap-2 text-teal dark:text-teal text-sm font-medium">
                <Check size={16} strokeWidth={1.5} /> Copied to clipboard — closing automatically…
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
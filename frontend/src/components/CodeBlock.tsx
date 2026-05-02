import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Play, ChevronDown } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  tryEndpoint?: string;
}

export default function CodeBlock({ code, language = 'bash', tryEndpoint }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTry = async () => {
    if (!tryEndpoint) return;
    setLoading(true);
    try {
      const res = await fetch(tryEndpoint);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-rule-dark dark:border-rule-dark">
      <div className="bg-[#1a1a2e] dark:bg-void flex items-center justify-between px-4 py-2">
        <span className="text-xs text-ash font-mono">{language}</span>
        <div className="flex items-center gap-2">
          {tryEndpoint && (
            <button
              onClick={handleTry}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-teal hover:text-white transition-colors font-mono"
            >
              <Play size={12} strokeWidth={1.5} />
              {loading ? 'Running…' : 'Try It'}
            </button>
          )}
          <button onClick={handleCopy} className="text-ash hover:text-cream transition-colors">
            {copied ? <Check size={14} strokeWidth={1.5} className="text-teal" /> : <Copy size={14} strokeWidth={1.5} />}
          </button>
        </div>
      </div>
      <pre className="bg-[#16162a] dark:bg-void p-4 overflow-x-auto text-sm font-mono text-cream leading-relaxed">
        <code>{code}</code>
      </pre>
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0d0d1a] dark:bg-void border-t border-rule-dark px-4 py-3">
              <div className="flex items-center gap-1 text-xs text-ash mb-2 font-mono">
                <ChevronDown size={12} strokeWidth={1.5} /> Response
              </div>
              <pre className="text-xs font-mono text-teal leading-relaxed overflow-x-auto whitespace-pre-wrap">{response}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
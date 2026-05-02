import { motion } from 'framer-motion';

interface AnomalyBadgeProps {
  severity?: 'low' | 'medium' | 'high';
}

export default function AnomalyBadge({ severity = 'medium' }: AnomalyBadgeProps) {
  const colors = {
    low: 'bg-yellow-400',
    medium: 'bg-accent dark:bg-coral',
    high: 'bg-red-600',
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <motion.span
          className={`absolute inset-0 rounded-full ${colors[severity]} opacity-75`}
          animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className={`relative rounded-full h-2.5 w-2.5 ${colors[severity]}`} />
      </span>
      <span className="text-xs font-heading font-semibold text-ink dark:text-cream capitalize">{severity}</span>
    </span>
  );
}
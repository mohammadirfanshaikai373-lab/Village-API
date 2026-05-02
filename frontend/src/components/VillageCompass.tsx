import { motion, useReducedMotion } from 'framer-motion';

interface VillageCompassProps {
  usage: number;
  limit: number;
  label?: string;
  size?: number;
}

export default function VillageCompass({ usage, limit, label = 'API Calls', size = 200 }: VillageCompassProps) {
  const shouldReduce = useReducedMotion();
  const pct = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
  const r1 = (size - 24) / 2;
  const r2 = r1 - 14;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const fill2 = (pct / 100) * c2;
  const cx = size / 2;
  const cy = size / 2;

  const color = pct > 90 ? '#D94F4F' : pct > 70 ? '#D97706' : '#0F3D3E';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Compass tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10) * Math.PI / 180;
          const inner = r1 + 6;
          const outer = r1 + (i % 9 === 0 ? 14 : 9);
          return (
            <line
              key={i}
              x1={cx + inner * Math.cos(angle)}
              y1={cy + inner * Math.sin(angle)}
              x2={cx + outer * Math.cos(angle)}
              y2={cy + outer * Math.sin(angle)}
              stroke="var(--color-compass)"
              strokeWidth={i % 9 === 0 ? 2 : 0.8}
              className="dark:stroke-[var(--color-compass-dark)]"
            />
          );
        })}
        {/* Outer ring - limit */}
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="var(--color-rule)" strokeWidth="6" className="dark:stroke-[var(--color-rule-dark)]" />
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeDasharray={`${c1 * 0.75} ${c1 * 0.25}`} strokeOpacity="0.15" className="dark:stroke-[var(--color-teal)]" />
        {/* Inner ring - usage */}
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke="var(--color-rule)" strokeWidth="8" className="dark:stroke-[var(--color-rule-dark)]" />
        <motion.circle
          cx={cx} cy={cy} r={r2}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={c2}
          initial={{ strokeDashoffset: shouldReduce ? c2 - fill2 : c2 }}
          animate={{ strokeDashoffset: c2 - fill2 }}
          transition={{ duration: shouldReduce ? 0 : 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-bold text-ink dark:text-cream">{usage.toLocaleString()}</span>
        <span className="text-xs text-faded dark:text-ash mt-0.5">{label}</span>
        <span className="text-[10px] text-faded dark:text-ash">of {limit.toLocaleString()}</span>
      </div>
    </div>
  );
}
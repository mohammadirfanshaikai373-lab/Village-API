export default function CompassRose({ size = 60, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className} fill="none">
      <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      {/* N-S line */}
      <line x1="30" y1="2" x2="30" y2="58" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      {/* E-W line */}
      <line x1="2" y1="30" x2="58" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      {/* N arrow */}
      <polygon points="30,4 27,14 33,14" fill="currentColor" opacity="0.5" />
      {/* S arrow */}
      <polygon points="30,56 27,46 33,46" fill="currentColor" opacity="0.25" />
      {/* E arrow */}
      <polygon points="56,30 46,27 46,33" fill="currentColor" opacity="0.25" />
      {/* W arrow */}
      <polygon points="4,30 14,27 14,33" fill="currentColor" opacity="0.25" />
      {/* Labels */}
      <text x="30" y="12" textAnchor="middle" fontSize="5" fill="currentColor" opacity="0.6" fontFamily="var(--font-heading)" fontWeight="700">N</text>
      <text x="30" y="52" textAnchor="middle" fontSize="4" fill="currentColor" opacity="0.3" fontFamily="var(--font-heading)">S</text>
      <text x="48" y="31.5" textAnchor="middle" fontSize="4" fill="currentColor" opacity="0.3" fontFamily="var(--font-heading)">E</text>
      <text x="12" y="31.5" textAnchor="middle" fontSize="4" fill="currentColor" opacity="0.3" fontFamily="var(--font-heading)">W</text>
    </svg>
  );
}
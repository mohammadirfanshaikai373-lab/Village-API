import { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { motion } from 'framer-motion';

interface StateData { state: string; count: number }

interface IndiaHeatmapProps {
  data: StateData[];
  height?: number;
  onStateClick?: (state: string) => void;
  fadeOnScroll?: boolean;
}

const GEO_URL = 'https://cdn.jsdelivr.net/gh/geohacker/india@master/state/india_state.geojson';

function getColor(count: number, max: number): string {
  if (max === 0) return '#E0F2F1';
  const ratio = count / max;
  if (ratio > 0.8) return '#004D40';
  if (ratio > 0.6) return '#00897B';
  if (ratio > 0.4) return '#26A69A';
  if (ratio > 0.2) return '#80CBC4';
  return '#E0F2F1';
}

function matchState(geoName: string, data: StateData[]): StateData | undefined {
  if (!geoName) return undefined;
  const lower = geoName.toLowerCase().replace(/[_-]/g, ' ');
  return data.find(d => {
    const dl = d.state.toLowerCase().replace(/[_-]/g, ' ');
    return dl === lower || dl.includes(lower) || lower.includes(dl);
  });
}

export default function IndiaHeatmap({ data, height = 420, onStateClick, fadeOnScroll }: IndiaHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; count: number; x: number; y: number } | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [scrollOpacity, setScrollOpacity] = useState(1);

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(d => setGeoData(d))
      .catch(() => setGeoData(null));
  }, []);

  useEffect(() => {
    if (!fadeOnScroll) return;
    const handler = () => {
      const scrollY = window.scrollY;
      setScrollOpacity(Math.max(0.15, 1 - scrollY / 600));
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [fadeOnScroll]);

  const max = Math.max(...data.map(d => d.count), 1);
  const maxState = data.reduce((a, b) => a.count > b.count ? a : b, { state: '', count: 0 });

  const handleMouseEnter = useCallback((geo: any, e: React.MouseEvent) => {
    const name = geo.properties?.NAME_1 || geo.properties?.name || geo.properties?.ST_NM || '';
    const match = matchState(name, data);
    setTooltip({ name, count: match?.count ?? 0, x: e.clientX, y: e.clientY });
  }, [data]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  if (!geoData) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-faded dark:text-ash text-sm font-body animate-pulse">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ opacity: scrollOpacity, transition: 'opacity 0.3s' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82, 22], scale: 700 }}
        width={600}
        height={height}
      >
        <Geographies geography={geoData}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const name = geo.properties?.NAME_1 || geo.properties?.name || geo.properties?.ST_NM || '';
              const match = matchState(name, data);
              const isMax = match?.state === maxState.state && maxState.count > 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e: any) => handleMouseEnter(geo, e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onStateClick?.(name)}
                  style={{
                    default: {
                      fill: match ? getColor(match.count, max) : '#E0F2F1',
                      stroke: '#0F3D3E',
                      strokeWidth: 0.5,
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    hover: {
                      fill: match ? getColor(match.count, max) : '#B2DFDB',
                      stroke: '#0F3D3E',
                      strokeWidth: 1,
                      outline: 'none',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-card dark:bg-card-dark border border-rule dark:border-rule-dark rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <div className="font-heading font-semibold text-sm text-ink dark:text-cream">{tooltip.name}</div>
          <div className="text-xs text-faded dark:text-ash">{tooltip.count.toLocaleString()} villages</div>
        </div>
      )}
      {/* Pulse on max state */}
      {maxState.state && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-card/80 dark:bg-card-dark/80 backdrop-blur-sm rounded-md px-2 py-1 border border-rule dark:border-rule-dark">
          <motion.div
            className="w-2 h-2 rounded-full bg-accent dark:bg-coral"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-mono text-ink dark:text-cream">{maxState.state}: {maxState.count.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
import AnimatedNumber from './AnimatedNumber';

interface StatCardProps {
  label: string;
  value: number | null;
  decimals?: number;
  unit?: string;
  accent?: string;
  trend?: number[];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-8" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const step = width / (data.length - 1);
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-8">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function StatCard({ label, value, decimals = 1, unit, accent = '#00E5FF', trend = [] }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="text-xs uppercase tracking-widest text-white/50 mb-2">{label}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-bold font-mono tabular-nums" style={{ color: accent }}>
          {value === null ? '--' : <AnimatedNumber value={value} decimals={decimals} />}
        </span>
        {unit && <span className="text-sm text-white/40">{unit}</span>}
      </div>
      <Sparkline data={trend} color={accent} />
    </div>
  );
}
interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: string;
}

export default function StatCard({ label, value, unit, accent = '#00E5FF' }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="text-xs uppercase tracking-widest text-white/50 mb-2">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold font-mono tabular-nums" style={{ color: accent }}>
          {value}
        </span>
        {unit && <span className="text-sm text-white/40">{unit}</span>}
      </div>
    </div>
  );
}
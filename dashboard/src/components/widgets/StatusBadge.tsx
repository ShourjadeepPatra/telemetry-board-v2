interface Props {
  label: string;
  active: boolean;
  activeColor?: string;
}

export default function StatusBadge({ label, active, activeColor = '#00FFA3' }: Props) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
        active
          ? 'border-white/20 bg-white/10'
          : 'border-white/5 bg-white/[0.02] opacity-50'
      }`}
    >
      <span className="text-sm text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${active ? 'animate-pulse' : ''}`}
          style={{ background: active ? activeColor : '#444' }}
        />
        <span
          className="font-mono text-sm font-bold"
          style={{ color: active ? activeColor : '#666' }}
        >
          {active ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
}
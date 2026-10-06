import type { AlgaeEvent } from '../../types';

interface Props {
  events: AlgaeEvent[];
}

export default function EventTicker({ events }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h2 className="text-sm uppercase tracking-widest text-white/60 mb-3">
        Live Event Stream
      </h2>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {events.length === 0 && (
          <p className="text-white/30 text-sm">No events yet.</p>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 text-xs rounded-lg bg-white/[0.03] px-3 py-2"
          >
            <span className="font-mono text-white/40">
              {new Date(e.created_at).toLocaleTimeString('en-IN')}
            </span>
            <span
              className={`font-mono font-bold ${
                e.event_type.includes('bloom_start') || e.event_type === 'pump_on'
                  ? 'text-[#FF4D6D]'
                  : 'text-[#00FFA3]'
              }`}
            >
              {e.event_type.toUpperCase()}
            </span>
            <span className="text-white/50 truncate">{e.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
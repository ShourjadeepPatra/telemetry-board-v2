import { useMemo, useState } from 'react';
import { predictBloom, formatEta } from '../../lib/prediction';
import { useConfig } from '../../hooks/useConfig';
import type { Reading } from '../../types';

interface Props {
  readings: Reading[];
}

// Horizon options in seconds
const HORIZONS = [
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '1h', seconds: 3600 },
];

export default function BloomPrediction({ readings }: Props) {
  const { config } = useConfig();
  const [horizonSec, setHorizonSec] = useState<number>(300); // default 5 min

  const prediction = useMemo(
    () => predictBloom(readings, config.algae_threshold, horizonSec),
    [readings, config.algae_threshold, horizonSec]
  );

  const hasPrediction = prediction.etaSeconds !== null;
  const confidencePct = Math.round(prediction.confidence * 100);

  // Color scheme based on urgency
  const urgency = hasPrediction
    ? prediction.etaSeconds! < 60
      ? 'critical'
      : prediction.etaSeconds! < 180
      ? 'warning'
      : 'watch'
    : 'clear';

  const styles: Record<string, { border: string; bg: string; text: string; dot: string; label: string }> = {
    critical: {
      border: 'border-[#FF4D6D]/60',
      bg: 'bg-[#FF4D6D]/10',
      text: 'text-[#FF4D6D]',
      dot: 'bg-[#FF4D6D] animate-pulse',
      label: 'CRITICAL',
    },
    warning: {
      border: 'border-[#FFB84D]/50',
      bg: 'bg-[#FFB84D]/5',
      text: 'text-[#FFB84D]',
      dot: 'bg-[#FFB84D] animate-pulse',
      label: 'WARNING',
    },
    watch: {
      border: 'border-[#00E5FF]/30',
      bg: 'bg-[#00E5FF]/5',
      text: 'text-[#00E5FF]',
      dot: 'bg-[#00E5FF]',
      label: 'WATCH',
    },
    clear: {
      border: 'border-[#00FFA3]/30',
      bg: 'bg-[#00FFA3]/5',
      text: 'text-[#00FFA3]',
      dot: 'bg-[#00FFA3]',
      label: 'STABLE',
    },
  };
  const s = styles[urgency];

  return (
    <div className={`rounded-2xl border backdrop-blur-xl p-5 ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-white/60">
          Bloom Forecast
        </h2>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className={`text-xs font-mono font-bold ${s.text}`}>{s.label}</span>
        </div>
      </div>

      {/* Prediction display */}
      {hasPrediction ? (
        <div className="mb-4">
          <div className={`text-3xl font-bold font-mono tabular-nums ${s.text}`}>
            {formatEta(prediction.etaSeconds!)}
          </div>
          <div className="text-xs text-white/50 mt-1">
            until clarity drops below {config.algae_threshold}%
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-3xl font-bold font-mono text-white/30">--</div>
          <div className="text-xs text-white/40 mt-1">
            no bloom predicted within {HORIZONS.find((h) => h.seconds === horizonSec)?.label}
          </div>
        </div>
      )}

      {/* Horizon selector */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
          Prediction window
        </div>
        <div className="flex gap-1.5">
          {HORIZONS.map((h) => (
            <button
              key={h.seconds}
              onClick={() => setHorizonSec(h.seconds)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                horizonSec === h.seconds
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
        <Stat label="Current" value={`${prediction.current.toFixed(0)}%`} />
        <Stat
          label="Trend"
          value={
            prediction.slope < -0.01
              ? `${prediction.slope.toFixed(2)}/s`
              : 'stable'
          }
          color={prediction.slope < -0.01 ? 'text-[#FF4D6D]' : 'text-white/40'}
        />
        <Stat label="Confidence" value={`${confidencePct}%`} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color = 'text-white/70',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">
        {label}
      </div>
      <div className={`text-xs font-mono ${color}`}>{value}</div>
    </div>
  );
}
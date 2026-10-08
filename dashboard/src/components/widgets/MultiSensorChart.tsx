import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts';
import type { Reading } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useConfig } from '../../hooks/useConfig';

interface Props {
  readings: Reading[];
}

type Metric = 'temperature' | 'max_do' | 'ph' | 'light_transmission';

const metricConfig: Record<Metric, { label: string; color: string; domain: [number, number] }> = {
  temperature: { label: 'Temperature °C', color: '#00E5FF', domain: [0, 40] },
  max_do: { label: 'Max DO mg/L', color: '#00FFA3', domain: [0, 14] },
  ph: { label: 'pH', color: '#FFB84D', domain: [0, 14] },
  light_transmission: { label: 'Clarity %', color: '#00E5FF', domain: [0, 100] },
};

const tabLabel: Record<Metric, string> = {
  temperature: 'Temp',
  max_do: 'DO',
  ph: 'pH',
  light_transmission: 'Clarity',
};

export default function MultiSensorChart({ readings }: Props) {
  const { theme } = useTheme();
  const { config } = useConfig();
  const isDark = theme === 'dark';
  const [metric, setMetric] = useState<Metric>('temperature');

  const algaeThreshold = config.algae_threshold;

  const data = readings.map((r) => ({
    time: new Date(r.created_at).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    value: r[metric],
  }));

  const cfg = metricConfig[metric];
  const showRiskZone = metric === 'light_transmission';

  const gridColor = isDark ? '#ffffff10' : '#0A0E1A12';
  const axisColor = isDark ? '#ffffff60' : '#0A0E1A99';
  const tooltipBg = isDark ? '#0A0E1A' : '#ffffff';
  const tooltipBorder = isDark ? '#ffffff20' : '#0A0E1A22';
  const tooltipText = isDark ? '#ffffff80' : '#0A0E1A99';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-white/60">Live Sensor Chart</h2>
        <div className="flex gap-2">
          {(Object.keys(metricConfig) as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                metric === m
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tabLabel[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-white/30 text-sm">
            Waiting for data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" stroke={axisColor} fontSize={11} tick={{ fill: axisColor }} />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                domain={cfg.domain}
                width={35}
                tick={{ fill: axisColor }}
              />
              <Tooltip
                contentStyle={{
                  background: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: isDark ? '#ffffff' : '#0A0E1A',
                }}
                labelStyle={{ color: tooltipText }}
                formatter={(value) => [Number(value).toFixed(2), cfg.label] as [string, string]}
              />
              {showRiskZone && (
                <>
                  <ReferenceArea
                    y1={0}
                    y2={algaeThreshold}
                    fill="#FF4D6D"
                    fillOpacity={0.08}
                  />
                  <ReferenceLine
                    y={algaeThreshold}
                    stroke="#FF4D6D"
                    strokeDasharray="4 4"
                    label={{
                      value: `Algae Risk Zone (<${algaeThreshold}%)`,
                      fill: '#FF4D6D',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                </>
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
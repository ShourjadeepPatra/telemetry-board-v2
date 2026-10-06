import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Reading } from '../../types';

interface Props {
  readings: Reading[];
}

type Metric = 'temperature' | 'max_do' | 'ph';

const metricConfig: Record<Metric, { label: string; color: string; domain: [number, number] }> = {
  temperature: { label: 'Temperature °C', color: '#00E5FF', domain: [0, 40] },
  max_do: { label: 'Max DO mg/L', color: '#00FFA3', domain: [0, 14] },
  ph: { label: 'pH', color: '#FFB84D', domain: [0, 14] },
};

export default function MultiSensorChart({ readings }: Props) {
  const [metric, setMetric] = useState<Metric>('temperature');

  const data = readings.map((r) => ({
    time: new Date(r.created_at).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    value: r[metric],
  }));

  const cfg = metricConfig[metric];

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
              {m === 'max_do' ? 'DO' : m === 'temperature' ? 'Temp' : 'pH'}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="time" stroke="#ffffff40" fontSize={11} />
              <YAxis stroke="#ffffff40" fontSize={11} domain={cfg.domain} width={35} />
              <Tooltip
                contentStyle={{
                  background: '#0A0E1A',
                  border: '1px solid #ffffff20',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#ffffff80' }}
              />
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
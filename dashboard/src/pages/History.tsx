import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { supabase } from '../lib/supabase';
import type { Reading } from '../types';
import { useCsvExport } from '../hooks/useCsvExport';

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

export default function History() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [metric, setMetric] = useState<Metric>('temperature');
  const [hours, setHours] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const { download } = useCsvExport();

  useEffect(() => {
    setLoading(true);
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    supabase
      .from('readings')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setReadings(data);
        setLoading(false);
      });
  }, [hours]);

  const data = readings.map((r) => ({
    time: new Date(r.created_at).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    }),
    value: r[metric],
  }));

  const cfg = metricConfig[metric];

  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold tracking-wide">Historical Data</h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            {loading ? 'Loading...' : `${readings.length} readings in last ${hours}h`}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
          </select>
          <button
            onClick={() => download('readings')}
            className="rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1.5 text-xs text-[#00E5FF] hover:bg-[#00E5FF]/20"
          >
            ⬇ Export CSV
          </button>
        </div>
      </header>

      <div className="flex gap-2 mb-4">
        {(Object.keys(metricConfig) as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              metric === m ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tabLabel[m]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 h-[500px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-white/30 text-sm">
            {loading ? 'Loading...' : 'No data in this range'}
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
                formatter={(value) => [Number(value).toFixed(2), cfg.label] as [string, string]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={1.5}
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
import WaterTank3D from '../components/widgets/WaterTank3D';
import { useCallback, useState } from 'react';
import { useRealtimeReadings } from '../hooks/useRealtimeReadings';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import StatCard from '../components/widgets/StatCard';
import MultiSensorChart from '../components/widgets/MultiSensorChart';
import StatusBadge from '../components/widgets/StatusBadge';
import EventTicker from '../components/widgets/EventTicker';
import DataExportPanel from '../components/widgets/DataExportPanel';
import Toasts, { type ToastData } from '../components/ui/Toast';
import type { AlgaeEvent } from '../types';

export default function Dashboard() {
  const { readings, latest } = useRealtimeReadings(60);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const handleNewEvent = useCallback((e: AlgaeEvent) => {
    const id = Date.now();
    const isBloomStart = e.event_type === 'bloom_start';
    setToasts((prev) => [
      ...prev,
      {
        id,
        title: e.event_type.replace('_', ' ').toUpperCase(),
        message: e.note ?? 'State change detected',
        type: isBloomStart ? 'alert' : 'success',
      },
    ]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const events = useRealtimeEvents(15, handleNewEvent);

  const isStale = latest
    ? Date.now() - new Date(latest.created_at).getTime() > 10000
    : false;

  const temps = readings.slice(-20).map((r) => r.temperature);
  const dos = readings.slice(-20).map((r) => r.max_do);
  const phs = readings.slice(-20).map((r) => r.ph);
  const clarity = readings.slice(-20).map((r) => r.light_transmission);

  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold tracking-wide">Live Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${isStale ? 'bg-red-500' : 'bg-[#00FFA3] animate-pulse'}`} />
            <span className={`font-mono ${isStale ? 'text-red-500' : 'text-[#00FFA3]'}`}>
              {isStale ? 'STALE' : 'LIVE'}
            </span>
          </span>
          <span className="font-mono text-xs text-white/40">
            {new Date().toLocaleTimeString('en-IN')}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Temperature" value={latest?.temperature ?? null} decimals={1} unit="°C" accent="#00E5FF" trend={temps} />
        <StatCard label="Max DO" value={latest?.max_do ?? null} decimals={1} unit="mg/L" accent="#00FFA3" trend={dos} />
        <StatCard label="pH" value={latest?.ph ?? null} decimals={2} accent="#FFB84D" trend={phs} />
        <StatCard
          label="Clarity"
          value={latest?.light_transmission ?? null}
          decimals={0}
          unit="%"
          accent={latest?.algae_detected ? '#FF4D6D' : '#00E5FF'}
          trend={clarity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <MultiSensorChart readings={readings} />
        </div>
        <div className="space-y-4">
          <div
            className={`rounded-2xl border backdrop-blur-xl p-5 space-y-3 transition-all ${
              latest?.algae_detected
                ? 'border-[#FF4D6D]/60 bg-[#FF4D6D]/5 shadow-[0_0_30px_rgba(255,77,109,0.15)]'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <h2 className="text-sm uppercase tracking-widest text-white/60 mb-3">System Status</h2>
            <StatusBadge label="Algae" active={latest?.algae_detected ?? false} activeColor="#FF4D6D" />
            <StatusBadge label="Pump" active={latest?.pump_on ?? false} activeColor="#00FFA3" />
          </div>
          <DataExportPanel />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <WaterTank3D latest={latest} />
        <EventTicker events={events} />
        </div>

      <footer className="mt-6 text-center text-xs text-white/30 font-mono">
        AeroAqua v2 · {readings.length} readings buffered
      </footer>

      <Toasts toasts={toasts} />
    </div>
  );
}
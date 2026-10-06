import { useRealtimeReadings } from './hooks/useRealtimeReadings';
import { useRealtimeEvents } from './hooks/useRealtimeEvents';
import StatCard from './components/widgets/StatCard';
import MultiSensorChart from './components/widgets/MultiSensorChart';
import StatusBadge from './components/widgets/StatusBadge';
import EventTicker from './components/widgets/EventTicker';
import DataExportPanel from './components/widgets/DataExportPanel';

function App() {
  const { readings, latest } = useRealtimeReadings(60);
  const events = useRealtimeEvents(15);

  return (
    <div className="min-h-screen text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌊</span>
          <h1 className="text-xl font-bold tracking-wide">AEROAQUA</h1>
          <span className="text-xs text-white/40 uppercase tracking-widest">Telemetry</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00FFA3] font-mono">LIVE</span>
          </span>
          <span className="font-mono text-xs text-white/40">
            {new Date().toLocaleTimeString('en-IN')}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Temperature" value={latest?.temperature?.toFixed(1) ?? '--'} unit="°C" accent="#00E5FF" />
        <StatCard label="Max DO" value={latest?.max_do?.toFixed(1) ?? '--'} unit="mg/L" accent="#00FFA3" />
        <StatCard label="pH" value={latest?.ph?.toFixed(2) ?? '--'} accent="#FFB84D" />
        <StatCard label="Clarity" value={latest?.light_transmission?.toFixed(0) ?? '--'} unit="%" accent="#00E5FF" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <MultiSensorChart readings={readings} />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
            <h2 className="text-sm uppercase tracking-widest text-white/60 mb-3">System Status</h2>
            <StatusBadge label="Algae" active={latest?.algae_detected ?? false} activeColor="#FF4D6D" />
            <StatusBadge label="Pump" active={latest?.pump_on ?? false} activeColor="#00FFA3" />
          </div>
          <DataExportPanel />
        </div>
      </div>

      <EventTicker events={events} />

      <footer className="mt-6 text-center text-xs text-white/30 font-mono">
        AeroAqua v2 · {readings.length} readings buffered
      </footer>
    </div>
  );
}

export default App;
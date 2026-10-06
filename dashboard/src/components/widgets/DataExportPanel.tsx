import { useCsvExport } from '../../hooks/useCsvExport';

export default function DataExportPanel() {
  const { download, loading } = useCsvExport();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h2 className="text-sm uppercase tracking-widest text-white/60 mb-3">Data Export</h2>
      <div className="space-y-2">
        <button
          disabled={loading}
          onClick={() => download('algae_events')}
          className="w-full rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-4 py-3 text-sm text-[#00E5FF] hover:bg-[#00E5FF]/20 transition disabled:opacity-50"
        >
          ⬇ Download Algae Events CSV
        </button>
        <button
          disabled={loading}
          onClick={() => download('readings')}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/10 transition disabled:opacity-50"
        >
          ⬇ Download Full Sensor Log CSV
        </button>
      </div>
    </div>
  );
}
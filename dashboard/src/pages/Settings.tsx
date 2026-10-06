import { useEffect, useState } from 'react';

interface Prefs {
  algaeThreshold: number;
  doOn: number;
  doOff: number;
  soundAlerts: boolean;
}

const DEFAULTS: Prefs = {
  algaeThreshold: 60,
  doOn: 6.5,
  doOff: 7.5,
  soundAlerts: false,
};

export default function Settings() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('aeroaqua-prefs');
    if (stored) setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
  }, []);

  const save = () => {
    localStorage.setItem('aeroaqua-prefs', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-lg font-bold tracking-wide">Settings</h1>
        <p className="text-xs text-white/40 mt-1">
          Adjust system thresholds and preferences. Saved locally.
        </p>
      </header>

      <div className="space-y-4">
        <SettingRow
          label="Algae Detection Threshold"
          description="Light transmission % below which algae is suspected"
          unit="%"
        >
          <input
            type="number"
            value={prefs.algaeThreshold}
            onChange={(e) => setPrefs({ ...prefs, algaeThreshold: Number(e.target.value) })}
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono"
          />
        </SettingRow>

        <SettingRow
          label="Pump ON threshold (DO)"
          description="Pump activates when dissolved oxygen drops below"
          unit="mg/L"
        >
          <input
            type="number"
            step="0.1"
            value={prefs.doOn}
            onChange={(e) => setPrefs({ ...prefs, doOn: Number(e.target.value) })}
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono"
          />
        </SettingRow>

        <SettingRow
          label="Pump OFF threshold (DO)"
          description="Pump deactivates when dissolved oxygen rises above"
          unit="mg/L"
        >
          <input
            type="number"
            step="0.1"
            value={prefs.doOff}
            onChange={(e) => setPrefs({ ...prefs, doOff: Number(e.target.value) })}
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono"
          />
        </SettingRow>

        <SettingRow label="Sound alerts" description="Play a chime on bloom events">
          <button
            onClick={() => setPrefs({ ...prefs, soundAlerts: !prefs.soundAlerts })}
            className={`w-12 h-6 rounded-full transition relative ${
              prefs.soundAlerts ? 'bg-[#00FFA3]' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                prefs.soundAlerts ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </SettingRow>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-lg bg-[#00E5FF] text-black font-medium px-5 py-2 text-sm hover:bg-[#00B8D4]"
        >
          Save Settings
        </button>
        {saved && <span className="text-xs text-[#00FFA3] font-mono">✓ Saved</span>}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/40 leading-relaxed">
        <p className="text-white/60 mb-2 font-medium">ℹ️ Note</p>
        These thresholds are stored client-side for demo purposes. In production, they'd
        sync to the ESP32 via a Supabase config table.
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  unit,
  children,
}: {
  label: string;
  description: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-white/40 mt-0.5">
          {description} {unit && <span className="font-mono">({unit})</span>}
        </div>
      </div>
      {children}
    </div>
  );
}
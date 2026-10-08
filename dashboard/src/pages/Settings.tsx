import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Config {
  algae_threshold: number;
  do_on: number;
  do_off: number;
}

const DEFAULTS: Config = {
  algae_threshold: 60,
  do_on: 6.5,
  do_off: 7.5,
};

const MIN_DO_BUFFER = 1.0; // minimum difference between do_off and do_on (mg/L)

// Validate thresholds. Returns error string or null if all good.
function validate(cfg: Config): string | null {
  if (!Number.isFinite(cfg.algae_threshold) ||
      !Number.isFinite(cfg.do_on) ||
      !Number.isFinite(cfg.do_off)) {
    return 'All fields must be valid numbers.';
  }

  if (cfg.algae_threshold < 0 || cfg.algae_threshold > 100) {
    return 'Algae threshold must be between 0 and 100%.';
  }

  if (cfg.do_on < 0 || cfg.do_on > 14) {
    return 'Pump ON threshold must be between 0 and 14 mg/L.';
  }

  if (cfg.do_off < 0 || cfg.do_off > 14) {
    return 'Pump OFF threshold must be between 0 and 14 mg/L.';
  }

  if (cfg.do_off <= cfg.do_on) {
    return 'Pump OFF threshold must be higher than Pump ON threshold.';
  }

  const buffer = cfg.do_off - cfg.do_on;
  if (buffer < MIN_DO_BUFFER) {
    return `Pump OFF must be at least ${MIN_DO_BUFFER.toFixed(1)} mg/L above Pump ON (current gap: ${buffer.toFixed(2)} mg/L).`;
  }

  return null;
}

export default function Settings() {
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [saved, setSaved] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  // ---- Load config from Supabase on mount ----
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('config')
        .select('algae_threshold, do_on, do_off')
        .eq('id', 1)
        .single();

      if (error) {
        setServerError(`Failed to load config: ${error.message}`);
      } else if (data) {
        setCfg(data);
        setSaved(data);
      }
      setLoading(false);
    })();
  }, []);

  // ---- Live validation (recomputes on every keystroke) ----
  const validationError = useMemo(() => validate(cfg), [cfg]);
  const dirty = useMemo(
    () =>
      cfg.algae_threshold !== saved.algae_threshold ||
      cfg.do_on !== saved.do_on ||
      cfg.do_off !== saved.do_off,
    [cfg, saved]
  );
  const canSave = dirty && !validationError && !saving;

  // ---- Save to Supabase ----
  const save = async () => {
    if (validationError || !dirty) return;

    setSaving(true);
    setServerError('');

    const { error } = await supabase
      .from('config')
      .update({
        algae_threshold: cfg.algae_threshold,
        do_on: cfg.do_on,
        do_off: cfg.do_off,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      setServerError(`Save failed: ${error.message}`);
      setStatus('error');
    } else {
      setSaved(cfg);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    }
    setSaving(false);
  };

  const resetToDefaults = () => {
    setCfg(DEFAULTS);
    setStatus('idle');
    setServerError('');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-lg font-bold tracking-wide mb-6">Settings</h1>
        <div className="text-white/40 text-sm font-mono">Loading config…</div>
      </div>
    );
  }

  // Compute DO buffer for live display
  const doBuffer = cfg.do_off - cfg.do_on;
  const bufferInvalid = !validationError && dirty ? false : doBuffer < MIN_DO_BUFFER;

  return (
    <div className="p-6 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-lg font-bold tracking-wide">Settings</h1>
        <p className="text-xs text-white/40 mt-1">
          Changes save to Supabase. The ESP32 picks them up within 30 seconds.
        </p>
      </header>

      {/* Validation error banner — appears LIVE as user types */}
      {validationError && (
        <div className="mb-4 rounded-xl border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 px-4 py-3 text-sm text-[#FF4D6D] flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">⚠</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Server error banner */}
      {serverError && !validationError && (
        <div className="mb-4 rounded-xl border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 px-4 py-3 text-sm text-[#FF4D6D] flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">⚠</span>
          <span>{serverError}</span>
        </div>
      )}

      <div className="space-y-4">
        <SettingRow
          label="Algae Detection Threshold"
          description="Light transmission % below which algae is suspected"
          unit="%"
        >
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={cfg.algae_threshold}
            onChange={(e) =>
              setCfg({ ...cfg, algae_threshold: Number(e.target.value) })
            }
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-[#00E5FF]"
          />
        </SettingRow>

        <SettingRow
          label="Pump ON threshold"
          description="Pump activates when dissolved oxygen drops below this"
          unit="mg/L"
        >
          <input
            type="number"
            min={0}
            max={14}
            step={0.1}
            value={cfg.do_on}
            onChange={(e) => setCfg({ ...cfg, do_on: Number(e.target.value) })}
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-[#00E5FF]"
          />
        </SettingRow>

        <SettingRow
          label="Pump OFF threshold"
          description="Pump deactivates when dissolved oxygen rises above this"
          unit="mg/L"
        >
          <input
            type="number"
            min={0}
            max={14}
            step={0.1}
            value={cfg.do_off}
            onChange={(e) => setCfg({ ...cfg, do_off: Number(e.target.value) })}
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-[#00E5FF]"
          />
        </SettingRow>

        {/* DO buffer info strip */}
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs font-mono flex items-center justify-between ${
            doBuffer >= MIN_DO_BUFFER
              ? 'border-[#00FFA3]/20 bg-[#00FFA3]/5 text-[#00FFA3]'
              : 'border-[#FF4D6D]/30 bg-[#FF4D6D]/5 text-[#FF4D6D]'
          }`}
        >
          <span className="uppercase tracking-widest text-[10px]">Hysteresis gap</span>
          <span>
            {doBuffer.toFixed(2)} mg/L {doBuffer >= MIN_DO_BUFFER ? '✓' : `(need ≥ ${MIN_DO_BUFFER.toFixed(1)})`}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <button
          onClick={save}
          disabled={!canSave}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
            canSave
              ? 'bg-[#00E5FF] text-black hover:bg-[#00B8D4]'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : 'Save to Cloud'}
        </button>

        {dirty && (
          <button
            onClick={resetToDefaults}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
          >
            Reset to defaults
          </button>
        )}

        {status === 'saved' && (
          <span className="text-xs text-[#00FFA3] font-mono animate-pulse">
            ✓ Synced to Supabase
          </span>
        )}

        {dirty && !validationError && status !== 'saved' && (
          <span className="text-xs text-white/40 font-mono">
            ● Unsaved changes
          </span>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/40 leading-relaxed">
        <p className="text-white/60 mb-2 font-medium">🔗 How this works</p>
        <p>
          These values live in the Supabase{' '}
          <span className="font-mono text-[#00E5FF]">config</span> table. The
          serial bridge polls them every 30 seconds and forwards any changes to
          the ESP32 over USB. No re-flashing, no firmware updates — just save
          here and the hardware updates itself.
        </p>
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
      <div className="pr-4">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-white/40 mt-0.5">
          {description} {unit && <span className="font-mono">({unit})</span>}
        </div>
      </div>
      {children}
    </div>
  );
}
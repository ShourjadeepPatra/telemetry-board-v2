import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Config {
  algae_threshold: number;
  do_on: number;
  do_off: number;
}

const DEFAULTS: Config = {
  algae_threshold: 60,
  do_on: 6.5,
  do_off: 7.5,
};

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // ---- Initial fetch ----
    (async () => {
      try {
        const { data, error } = await supabase
          .from('config')
          .select('algae_threshold, do_on, do_off')
          .eq('id', 1)
          .single();

        if (!cancelled && !error && data) {
          setConfig({
            algae_threshold: data.algae_threshold,
            do_on: data.do_on,
            do_off: data.do_off,
          });
        }
      } catch (e) {
        console.warn('useConfig: initial fetch failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // ---- Realtime subscription (fully defensive) ----
    try {
      channel = supabase
        .channel('config_live')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'config' },
          (payload) => {
            const row = payload.new as Config;
            if (!cancelled) {
              setConfig({
                algae_threshold: row.algae_threshold,
                do_on: row.do_on,
                do_off: row.do_off,
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(
              'useConfig: realtime unavailable — config changes will not auto-refresh live.'
            );
          }
        });
    } catch (e) {
      console.warn('useConfig: realtime subscription threw', e);
    }

    return () => {
      cancelled = true;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { config, loading };
}
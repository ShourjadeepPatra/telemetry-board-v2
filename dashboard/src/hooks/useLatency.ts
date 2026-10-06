import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useLatency(intervalMs = 30000) {
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      const start = performance.now();
      await supabase.from('config').select('id').limit(1);
      const ms = Math.round(performance.now() - start);
      if (!cancelled) setLatency(ms);
    };

    ping();
    const id = setInterval(ping, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return latency;
}
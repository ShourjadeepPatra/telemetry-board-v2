import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Reading } from '../types';

export function useRealtimeReadings(bufferSize = 60) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [latest, setLatest] = useState<Reading | null>(null);

  useEffect(() => {
    supabase
      .from('readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(bufferSize)
      .then(({ data }) => {
        if (data && data.length) {
          const ordered = [...data].reverse();
          setReadings(ordered);
          setLatest(ordered[ordered.length - 1]);
        }
      });

    const channel = supabase
      .channel('readings_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'readings' },
        (payload) => {
          const row = payload.new as Reading;
          setLatest(row);
          setReadings((prev) => [...prev, row].slice(-bufferSize));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bufferSize]);

  return { readings, latest };
}
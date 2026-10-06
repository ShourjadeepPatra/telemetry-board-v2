import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AlgaeEvent } from '../types';

export function useRealtimeEvents(
  limit = 15,
  onNewEvent?: (e: AlgaeEvent) => void
) {
  const [events, setEvents] = useState<AlgaeEvent[]>([]);

  useEffect(() => {
    supabase
      .from('algae_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => data && setEvents(data));

    const channel = supabase
      .channel('events_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'algae_events' },
        (payload) => {
          const newEvent = payload.new as AlgaeEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, limit));
          onNewEvent?.(newEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit, onNewEvent]);

  return events;
}
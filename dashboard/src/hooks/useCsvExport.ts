import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { convertToCsv, triggerDownload } from '../lib/csv';

export function useCsvExport() {
  const [loading, setLoading] = useState(false);

  async function download(table: 'readings' | 'algae_events') {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!data?.length) {
        alert('No data yet.');
        return;
      }
      const csv = convertToCsv(data);
      triggerDownload(csv, `${table}_${Date.now()}.csv`);
    } catch (e) {
      console.error(e);
      alert('Export failed.');
    } finally {
      setLoading(false);
    }
  }

  return { download, loading };
}
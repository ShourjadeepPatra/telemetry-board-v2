import { useEffect, useState } from 'react';

const SESSION_KEY = 'aeroaqua-session-start';

export function useUptime() {
  const [start] = useState<number>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    sessionStorage.setItem(SESSION_KEY, String(now));
    return now;
  });

  const [elapsed, setElapsed] = useState(() => Date.now() - start);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, [start]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const formatted = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}m`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return { start, formatted };
}
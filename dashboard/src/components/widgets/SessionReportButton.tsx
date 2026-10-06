import { useState } from 'react';
import { generateSessionReport } from '../../lib/report';
import type { Reading, AlgaeEvent } from '../../types';

interface Props {
  readings: Reading[];
  events: AlgaeEvent[];
  sessionStart: number;
}

export default function SessionReportButton({ readings, events, sessionStart }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    try {
      generateSessionReport({ readings, events, sessionStart });
    } catch (e) {
      console.error(e);
      alert('Report generation failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || readings.length === 0}
      className="w-full rounded-lg bg-[#00FFA3]/10 border border-[#00FFA3]/30 px-4 py-3 text-sm text-[#00FFA3] hover:bg-[#00FFA3]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Generating...' : '📄 Download Session Report PDF'}
    </button>
  );
}
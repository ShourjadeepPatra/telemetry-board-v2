import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// ---- CONFIG ----
const SERIAL_PORT = 'COM7';      // 👈 CHANGE to your actual COM port
const BAUD_RATE = 115200;
// ----------------

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log(`🔌 Opening ${SERIAL_PORT} @ ${BAUD_RATE}...`);

const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

let prevAlgae = false;
let prevPump = false;
let lastChangeMs = Date.now();

parser.on('data', async (line) => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return; // skip non-JSON

  let d;
  try {
    d = JSON.parse(trimmed);
  } catch {
    return;
  }

  // --- Push reading to Supabase ---
  const { error } = await supabase.from('readings').insert({
    temperature: d.t,
    max_do: d.do,
    ph: d.ph,
    light_transmission: d.lt,
    algae_detected: d.algae,
    pump_on: d.pump,
  });

  if (error) {
    console.error('❌ reading insert:', error.message);
  } else {
    process.stdout.write(
      `\r📤 T=${d.t}°C DO=${d.do} pH=${d.ph} LT=${d.lt}% algae=${d.algae ? 'Y' : 'N'} pump=${d.pump ? 'Y' : 'N'}   `
    );
  }

  // --- Detect state changes → log events ---
  const nowMs = Date.now();
  const durSec = Math.round((nowMs - lastChangeMs) / 1000);

  if (d.algae && !prevAlgae) {
    await logEvent('bloom_start', d, durSec, 'Transmission dropped below threshold');
    lastChangeMs = nowMs;
  } else if (!d.algae && prevAlgae) {
    await logEvent('bloom_end', d, durSec, 'Clarity restored above threshold');
    lastChangeMs = nowMs;
  }

  if (d.pump && !prevPump) {
    await logEvent('pump_on', d, durSec, 'Pump engaged');
  } else if (!d.pump && prevPump) {
    await logEvent('pump_off', d, durSec, 'Pump disengaged');
  }

  prevAlgae = d.algae;
  prevPump = d.pump;
});

async function logEvent(type, d, durSec, note) {
  const { error } = await supabase.from('algae_events').insert({
    event_type: type,
    temperature: d.t,
    max_do: d.do,
    ph: d.ph,
    light_transmission: d.lt,
    algae_detected: d.algae,
    pump_on: d.pump,
    duration_seconds: durSec,
    note,
  });
  if (error) console.error(`\n❌ event ${type}:`, error.message);
  else console.log(`\n🎯 EVENT: ${type} (after ${durSec}s)`);
}

port.on('error', (err) => console.error('Serial error:', err.message));
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// ============================================================
// CONFIG
// ============================================================
let SERIAL_PORT = process.env.BRIDGE_COM_PORT;

if (!SERIAL_PORT) {
  const ports = await SerialPort.list();
  if (ports.length === 0) {
    console.error('❌ No serial ports found. Plug in the ESP32.');
    process.exit(1);
  }
  SERIAL_PORT = ports[0].path;
  console.log(`⚠️  BRIDGE_COM_PORT not set. Auto-selected: ${SERIAL_PORT}`);
}

const BAUD_RATE = 115200;
const CONFIG_POLL_INTERVAL_MS = 30000; // poll Supabase config every 30s

// ============================================================
// SUPABASE
// ============================================================
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// ============================================================
// SERIAL PORT
// ============================================================
console.log(`🔌 Opening ${SERIAL_PORT} @ ${BAUD_RATE}...`);

const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// ============================================================
// STATE
// ============================================================
let prevAlgae = false;
let prevPump = false;
let lastChangeMs = Date.now();

// Track last config we sent to ESP32 so we don't spam commands
let lastSentConfig = {
  algae_threshold: null,
  do_on: null,
  do_off: null,
};

// ============================================================
// CONFIG POLLING
// Polls Supabase `config` table and pushes changes to ESP32.
// Runs on boot + every 30 seconds.
// ============================================================
async function pollConfig() {
  const { data, error } = await supabase
    .from('config')
    .select('algae_threshold, do_on, do_off')
    .eq('id', 1)
    .single();

  if (error) {
    console.error(`\n❌ config fetch: ${error.message}`);
    return;
  }
  if (!data) return;

  const { algae_threshold, do_on, do_off } = data;

  // Only send if something changed since last push
  const changed =
    lastSentConfig.algae_threshold !== algae_threshold ||
    lastSentConfig.do_on !== do_on ||
    lastSentConfig.do_off !== do_off;

  if (!changed) return;

  // Sanity-check before sending — don't push garbage to the ESP32
  if (
    algae_threshold < 0 || algae_threshold > 100 ||
    do_on < 0 || do_on > 14 ||
    do_off < 0 || do_off > 14 ||
    do_off <= do_on
  ) {
    console.error(`\n⚠️  Config out of range — skipping push:`, data);
    return;
  }

  const cmd = `CFG:${algae_threshold}:${do_on}:${do_off}\n`;
  port.write(cmd, (err) => {
    if (err) {
      console.error(`\n❌ serial write failed: ${err.message}`);
    } else {
      console.log(
        `\n🔄 Pushed config to ESP32: A=${algae_threshold}% ON=${do_on} OFF=${do_off}`
      );
      lastSentConfig = { algae_threshold, do_on, do_off };
    }
  });
}

// Initial config push on boot (give ESP32 a moment to settle)
setTimeout(() => {
  console.log('⏳ Syncing initial config to ESP32...');
  pollConfig();
}, 3000);

// Repeat every 30s
setInterval(pollConfig, CONFIG_POLL_INTERVAL_MS);

// ============================================================
// READINGS FORWARDING (from ESP32 → Supabase)
// ============================================================
parser.on('data', async (line) => {
  const trimmed = line.trim();

  // Skip non-JSON lines (debug output from ESP32)
  if (!trimmed.startsWith('{')) {
    // Print ESP32's own debug lines so you see them live
    if (trimmed.length > 0) {
      console.log(`  [esp32] ${trimmed}`);
    }
    return;
  }

  let d;
  try {
    d = JSON.parse(trimmed);
  } catch {
    return;
  }

  // ---- Push reading to Supabase ----
  const { error } = await supabase.from('readings').insert({
    temperature: d.t,
    max_do: d.do,
    ph: d.ph,
    light_transmission: d.lt,
    algae_detected: d.algae,
    pump_on: d.pump,
  });

  if (error) {
    console.error(`\n❌ reading insert: ${error.message}`);
  } else {
    process.stdout.write(
      `\r📤 T=${d.t}°C DO=${d.do} pH=${d.ph} LT=${d.lt}% algae=${d.algae ? 'Y' : 'N'} pump=${d.pump ? 'Y' : 'N'}    `
    );
  }

  // ---- Detect state changes → log events ----
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

// ============================================================
// EVENT LOGGING
// ============================================================
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
  if (error) console.error(`\n❌ event ${type}: ${error.message}`);
  else console.log(`\n🎯 EVENT: ${type} (after ${durSec}s)`);
}

// ============================================================
// ERROR HANDLING
// ============================================================
port.on('error', (err) => console.error('Serial error:', err.message));

port.on('close', () => {
  console.log('\n⚠️  Serial port closed. Reconnect the ESP32 and restart the bridge.');
  process.exit(0);
});
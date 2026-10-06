import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

let algae = false;
let pump = false;
let counter = 0;

console.log('🚀 Simulator started. Press Ctrl+C to stop.\n');

setInterval(async () => {
  counter++;
  if (counter % 30 === 0) {
    algae = !algae;
    pump = algae;
    const type = algae ? 'bloom_start' : 'bloom_end';

    await supabase.from('algae_events').insert({
      event_type: type,
      temperature: 24 + Math.random(),
      ph: 7 + Math.random() * 0.3,
      max_do: 6 + Math.random() * 2,
      light_transmission: algae ? 35 + Math.random() * 15 : 75 + Math.random() * 20,
      algae_detected: algae,
      pump_on: pump,
      duration_seconds: 60,
      note: algae ? 'Clarity dropped below threshold' : 'Clarity restored',
    });
    console.log(`[EVENT] ${type}`);
  }

  const transmission = algae ? 40 + Math.random() * 15 : 75 + Math.random() * 20;

  await supabase.from('readings').insert({
    temperature: 24 + Math.random() * 1.5,
    max_do: 6 + Math.random() * 2,
    ph: 7 + Math.random() * 0.4,
    light_transmission: transmission,
    algae_detected: algae,
    pump_on: pump,
  });
}, 1000);
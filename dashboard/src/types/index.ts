export interface Reading {
  id: number;
  created_at: string;
  device_id: string;
  temperature: number;
  max_do: number;
  ph: number;
  light_transmission: number;
  algae_detected: boolean;
  pump_on: boolean;
}

export interface AlgaeEvent {
  id: number;
  created_at: string;
  event_type: string;
  temperature: number;
  ph: number;
  max_do: number;
  light_transmission: number;
  algae_detected: boolean;
  pump_on: boolean;
  duration_seconds: number;
  note: string;
}
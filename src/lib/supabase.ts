import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_PUBLISHABLE_KEY',
  ].filter(Boolean).join(', ');

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: system-ui, sans-serif; max-width: 640px; margin: 80px auto; padding: 24px; color: #1f2937;">
        <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 12px;">Configuration Error</h1>
        <p style="font-size: 16px; line-height: 1.5;">The app could not start because the following environment variable(s) are missing: <strong>${missing}</strong>.</p>
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280;">If this is a deployed build, make sure these are set as secrets in your GitHub repository settings (Settings &rarr; Secrets and variables &rarr; Actions).</p>
      </div>
    `;
  }
  throw new Error(`Missing Supabase environment variables: ${missing}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export type HeatingDataRow = {
  id: string;
  date: string; // Will be in YYYY-MM-DD format from database
  time: string; // Will be in HH:MM:SS format from database
  collector_temp: number;
  outside_temp: number;
  dhw_temp_top: number;
  dhw_temp_bottom: number;
  flow_temp: number;
  flow_temp_setpoint: number;
  burner_starts: number;
  boiler_modulation: string;
  fan_control: number;
  collector_pump: string;
  boiler_pump: string;
  burner_state: string;
  solar_status: string;
  water_pressure: number;
  dhw_pump: string;
  fan_speed: number;
  return_temp: number;
  boiler_pump_speed: number;
  sensor_temp: number;
  created_at: string;
  updated_at: string;
};

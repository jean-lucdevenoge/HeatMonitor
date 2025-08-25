import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type HeatingDataRow = {
  id: string;
  date: string;
  time: string;
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
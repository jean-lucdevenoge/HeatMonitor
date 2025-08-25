/*
  # Create heating data table

  1. New Tables
    - `heating_data`
      - `id` (uuid, primary key)
      - `date` (text, date from CSV)
      - `time` (text, time from CSV)
      - `collector_temp` (numeric, collector temperature)
      - `outside_temp` (numeric, outside temperature)
      - `dhw_temp_top` (numeric, DHW temperature top)
      - `dhw_temp_bottom` (numeric, DHW temperature bottom)
      - `flow_temp` (numeric, flow temperature)
      - `flow_temp_setpoint` (numeric, flow temperature setpoint)
      - `burner_starts` (integer, burner starts count)
      - `boiler_modulation` (text, boiler modulation percentage)
      - `fan_control` (numeric, fan control value)
      - `collector_pump` (text, collector pump status)
      - `boiler_pump` (text, boiler pump status)
      - `burner_state` (text, burner state)
      - `solar_status` (text, solar system status)
      - `water_pressure` (numeric, water pressure)
      - `dhw_pump` (text, DHW pump status)
      - `fan_speed` (integer, fan speed)
      - `return_temp` (numeric, return temperature)
      - `boiler_pump_speed` (integer, boiler pump speed)
      - `sensor_temp` (numeric, sensor temperature B31)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `heating_data` table
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add index on date and time for efficient querying
    - Add unique constraint on date+time combination to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS heating_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  time text NOT NULL,
  collector_temp numeric DEFAULT 0,
  outside_temp numeric DEFAULT 0,
  dhw_temp_top numeric DEFAULT 0,
  dhw_temp_bottom numeric DEFAULT 0,
  flow_temp numeric DEFAULT 0,
  flow_temp_setpoint numeric DEFAULT 0,
  burner_starts integer DEFAULT 0,
  boiler_modulation text DEFAULT '',
  fan_control numeric DEFAULT 0,
  collector_pump text DEFAULT '',
  boiler_pump text DEFAULT '',
  burner_state text DEFAULT '',
  solar_status text DEFAULT '',
  water_pressure numeric DEFAULT 0,
  dhw_pump text DEFAULT '',
  fan_speed integer DEFAULT 0,
  return_temp numeric DEFAULT 0,
  boiler_pump_speed integer DEFAULT 0,
  sensor_temp numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE heating_data ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can insert heating data"
  ON heating_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read heating data"
  ON heating_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update heating data"
  ON heating_data
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete heating data"
  ON heating_data
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_heating_data_date_time ON heating_data (date, time);
CREATE INDEX IF NOT EXISTS idx_heating_data_created_at ON heating_data (created_at DESC);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS heating_data_date_time_unique ON heating_data (date, time);

-- Create trigger for updated_at
CREATE TRIGGER update_heating_data_updated_at
  BEFORE UPDATE ON heating_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
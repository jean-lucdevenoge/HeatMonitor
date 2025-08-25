/*
  # Create energy calculations table

  1. New Tables
    - `energy_calculations`
      - `id` (uuid, primary key)
      - `date` (date)
      - `solar_energy_kwh` (numeric) - Total solar energy for the day
      - `gas_energy_kwh` (numeric) - Total gas energy for the day
      - `total_energy_kwh` (numeric) - Combined energy for the day
      - `solar_active_minutes` (integer) - Minutes solar was active
      - `gas_active_minutes` (integer) - Minutes gas was active
      - `avg_collector_temp` (numeric) - Average collector temperature
      - `avg_dhw_temp` (numeric) - Average DHW temperature
      - `avg_outside_temp` (numeric) - Average outside temperature
      - `max_collector_temp` (numeric) - Maximum collector temperature
      - `max_dhw_temp` (numeric) - Maximum DHW temperature
      - `min_outside_temp` (numeric) - Minimum outside temperature
      - `max_outside_temp` (numeric) - Maximum outside temperature
      - `avg_water_pressure` (numeric) - Average water pressure
      - `data_points_count` (integer) - Number of data points for the day
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `energy_calculations` table
    - Add policies for authenticated users to read data
*/

CREATE TABLE IF NOT EXISTS energy_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  solar_energy_kwh numeric DEFAULT 0,
  gas_energy_kwh numeric DEFAULT 0,
  total_energy_kwh numeric DEFAULT 0,
  solar_active_minutes integer DEFAULT 0,
  gas_active_minutes integer DEFAULT 0,
  avg_collector_temp numeric DEFAULT 0,
  avg_dhw_temp numeric DEFAULT 0,
  avg_outside_temp numeric DEFAULT 0,
  max_collector_temp numeric DEFAULT 0,
  max_dhw_temp numeric DEFAULT 0,
  min_outside_temp numeric DEFAULT 0,
  max_outside_temp numeric DEFAULT 0,
  avg_water_pressure numeric DEFAULT 0,
  data_points_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_energy_calculations_date ON energy_calculations (date DESC);

-- Enable RLS
ALTER TABLE energy_calculations ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read energy calculations"
  ON energy_calculations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert energy calculations"
  ON energy_calculations
  FOR INSERT
  TO authenticated
  USING (true);

CREATE POLICY "System can update energy calculations"
  ON energy_calculations
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_energy_calculations_updated_at
  BEFORE UPDATE ON energy_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
/*
  # Create energy calculations table

  1. New Tables
    - `energy_calculations`
      - `id` (uuid, primary key)
      - `date` (date, unique) - The date for the energy calculations
      - `solar_energy_kwh` (numeric) - Total solar energy produced in kWh
      - `gas_energy_kwh` (numeric) - Total gas energy consumed in kWh
      - `total_energy_kwh` (numeric) - Combined solar + gas energy in kWh
      - `solar_active_minutes` (integer) - Minutes solar system was active
      - `gas_active_minutes` (integer) - Minutes gas system was active
      - `avg_collector_temp` (numeric) - Average collector temperature
      - `avg_dhw_temp` (numeric) - Average DHW temperature
      - `avg_outside_temp` (numeric) - Average outside temperature
      - `max_collector_temp` (numeric) - Maximum collector temperature
      - `max_dhw_temp` (numeric) - Maximum DHW temperature
      - `min_outside_temp` (numeric) - Minimum outside temperature
      - `max_outside_temp` (numeric) - Maximum outside temperature
      - `avg_water_pressure` (numeric) - Average water pressure
      - `data_points_count` (integer) - Number of raw data points used for calculation
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `energy_calculations` table
    - Add policies for authenticated users to read data
    - Add policies for system to insert/update data

  3. Indexes
    - Index on date for fast daily lookups
    - Index on created_at for chronological queries
*/

-- Create energy calculations table
CREATE TABLE IF NOT EXISTS energy_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_energy_calculations_date ON energy_calculations(date);
CREATE INDEX IF NOT EXISTS idx_energy_calculations_created_at ON energy_calculations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE energy_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read data
CREATE POLICY "Users can read energy calculations"
  ON energy_calculations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for system to insert/update data (for edge functions)
CREATE POLICY "System can insert energy calculations"
  ON energy_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update energy calculations"
  ON energy_calculations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_energy_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_energy_calculations_updated_at
  BEFORE UPDATE ON energy_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_calculations_updated_at();
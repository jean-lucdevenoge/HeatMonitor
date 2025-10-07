/*
  # Create House Heating Calculations Table

  1. New Tables
    - `house_heating_calculations`
      - `id` (uuid, primary key)
      - `date` (date, unique) - The date for the house heating calculations
      - `house_heating_energy_kwh` (numeric) - Total house heating energy consumed in kWh
      - `house_heating_active_minutes` (integer) - Minutes house heating was active
      - `avg_flow_temp` (numeric) - Average flow temperature
      - `avg_return_temp` (numeric) - Average return temperature
      - `avg_outside_temp` (numeric) - Average outside temperature
      - `max_flow_temp` (numeric) - Maximum flow temperature
      - `min_outside_temp` (numeric) - Minimum outside temperature
      - `max_outside_temp` (numeric) - Maximum outside temperature
      - `avg_boiler_modulation` (numeric) - Average boiler modulation percentage
      - `total_burner_starts` (integer) - Total number of burner starts
      - `data_points_count` (integer) - Number of raw data points used for calculation
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `house_heating_calculations` table
    - Add policies for authenticated users to read data
    - Add policies for system to insert/update data

  3. Indexes
    - Index on date for fast daily lookups
    - Index on created_at for chronological queries

  4. Important Notes
    - House heating is when burner is active AND DHW pump is off
    - This table tracks heating for living spaces, not hot water
*/

-- Create house heating calculations table
CREATE TABLE IF NOT EXISTS house_heating_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  house_heating_energy_kwh numeric DEFAULT 0,
  house_heating_active_minutes integer DEFAULT 0,
  avg_flow_temp numeric DEFAULT 0,
  avg_return_temp numeric DEFAULT 0,
  avg_outside_temp numeric DEFAULT 0,
  max_flow_temp numeric DEFAULT 0,
  min_outside_temp numeric DEFAULT 0,
  max_outside_temp numeric DEFAULT 0,
  avg_boiler_modulation numeric DEFAULT 0,
  total_burner_starts integer DEFAULT 0,
  data_points_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_house_heating_calculations_date ON house_heating_calculations(date);
CREATE INDEX IF NOT EXISTS idx_house_heating_calculations_created_at ON house_heating_calculations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE house_heating_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read data
CREATE POLICY "Users can read house heating calculations"
  ON house_heating_calculations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for system to insert/update data
CREATE POLICY "System can insert house heating calculations"
  ON house_heating_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update house heating calculations"
  ON house_heating_calculations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_house_heating_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_house_heating_calculations_updated_at
  BEFORE UPDATE ON house_heating_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_house_heating_calculations_updated_at();

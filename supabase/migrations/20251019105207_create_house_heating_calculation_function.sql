/*
  # Create House Heating Calculation Function

  1. New Functions
    - `calculate_house_heating_for_date_range(date_from DATE, date_to DATE)` - Calculates house heating for a specific date range
    - `calculate_house_heating_all()` - Calculates house heating for all dates in heating_data table

  2. Purpose
    - Provides a centralized SQL-based calculation for house heating energy
    - Can be called from edge functions, triggers, or manually
    - Much more efficient than JavaScript-based calculations

  3. Calculation Logic
    - House heating occurs when: burner_state = 'In operation' AND DHW pump is off
    - Energy calculation: (10kW * boiler_modulation / 100) / 60 per minute
    - Aggregates daily totals with temperature and modulation averages

  4. Important Notes
    - Uses UPSERT logic (INSERT ... ON CONFLICT ... DO UPDATE)
    - Handles all edge cases (null values, invalid modulation strings)
    - Returns the number of days calculated
*/

-- Function to calculate house heating for a specific date range
CREATE OR REPLACE FUNCTION calculate_house_heating_for_date_range(
  date_from DATE,
  date_to DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  -- Insert or update house heating calculations for the date range
  WITH calculations AS (
    SELECT
      date,
      -- Calculate energy: sum of (10kW * boiler_modulation / 100) / 60 for each minute
      -- Only when burner is on AND DHW pump is off (house heating mode)
      COALESCE(SUM(
        CASE
          WHEN burner_state = 'In operation'
          AND (dhw_pump = 'Off' OR dhw_pump = 'off' OR dhw_pump = '' OR dhw_pump IS NULL)
          AND boiler_modulation NOT IN ('----', '')
          THEN (10.0 * CAST(REPLACE(REPLACE(NULLIF(boiler_modulation, ''), '%', ''), '----', '0') AS NUMERIC) / 100.0) / 60.0
          ELSE 0
        END
      ), 0) as house_heating_energy_kwh,
      -- Count active minutes (burner on + DHW pump off)
      COALESCE(SUM(
        CASE
          WHEN burner_state = 'In operation'
          AND (dhw_pump = 'Off' OR dhw_pump = 'off' OR dhw_pump = '' OR dhw_pump IS NULL)
          AND boiler_modulation NOT IN ('----', '')
          THEN 1
          ELSE 0
        END
      ), 0) as house_heating_active_minutes,
      -- Average temperatures
      AVG(COALESCE(flow_temp, 0)) as avg_flow_temp,
      AVG(COALESCE(return_temp, 0)) as avg_return_temp,
      AVG(COALESCE(outside_temp, 0)) as avg_outside_temp,
      MAX(COALESCE(flow_temp, 0)) as max_flow_temp,
      MIN(COALESCE(outside_temp, 0)) as min_outside_temp,
      MAX(COALESCE(outside_temp, 0)) as max_outside_temp,
      -- Average boiler modulation when house heating is active
      AVG(
        CASE
          WHEN burner_state = 'In operation'
          AND (dhw_pump = 'Off' OR dhw_pump = 'off' OR dhw_pump = '' OR dhw_pump IS NULL)
          AND boiler_modulation NOT IN ('----', '')
          THEN CAST(REPLACE(REPLACE(NULLIF(boiler_modulation, ''), '%', ''), '----', '0') AS NUMERIC)
          ELSE NULL
        END
      ) as avg_boiler_modulation,
      MAX(COALESCE(burner_starts, 0)) as total_burner_starts,
      COUNT(*) as data_points_count
    FROM heating_data
    WHERE date >= date_from AND date <= date_to
    GROUP BY date
    HAVING COUNT(*) > 0
  )
  INSERT INTO house_heating_calculations (
    date,
    house_heating_energy_kwh,
    house_heating_active_minutes,
    avg_flow_temp,
    avg_return_temp,
    avg_outside_temp,
    max_flow_temp,
    min_outside_temp,
    max_outside_temp,
    avg_boiler_modulation,
    total_burner_starts,
    data_points_count
  )
  SELECT * FROM calculations
  ON CONFLICT (date)
  DO UPDATE SET
    house_heating_energy_kwh = EXCLUDED.house_heating_energy_kwh,
    house_heating_active_minutes = EXCLUDED.house_heating_active_minutes,
    avg_flow_temp = EXCLUDED.avg_flow_temp,
    avg_return_temp = EXCLUDED.avg_return_temp,
    avg_outside_temp = EXCLUDED.avg_outside_temp,
    max_flow_temp = EXCLUDED.max_flow_temp,
    min_outside_temp = EXCLUDED.min_outside_temp,
    max_outside_temp = EXCLUDED.max_outside_temp,
    avg_boiler_modulation = EXCLUDED.avg_boiler_modulation,
    total_burner_starts = EXCLUDED.total_burner_starts,
    data_points_count = EXCLUDED.data_points_count,
    updated_at = NOW();

  -- Get number of rows affected
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN rows_affected;
END;
$$;

-- Function to calculate house heating for all dates
CREATE OR REPLACE FUNCTION calculate_house_heating_all()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
  min_date DATE;
  max_date DATE;
BEGIN
  -- Get the date range from heating_data
  SELECT MIN(date), MAX(date) INTO min_date, max_date FROM heating_data;
  
  IF min_date IS NULL OR max_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Call the date range function
  SELECT calculate_house_heating_for_date_range(min_date, max_date) INTO rows_affected;
  
  RETURN rows_affected;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_house_heating_for_date_range(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_house_heating_all() TO authenticated;

-- Direct SQL to populate house_heating_calculations from heating_data
-- This calculates house heating energy (burner on + DHW pump off)

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
SELECT
  date,
  -- Calculate energy: sum of (10kW * boiler_modulation / 100) / 60 for each minute
  SUM(
    CASE
      WHEN burner_state = 'on' AND (dhw_pump = 'off' OR dhw_pump = '')
      THEN (10.0 * CAST(NULLIF(boiler_modulation, '') AS NUMERIC) / 100.0) / 60.0
      ELSE 0
    END
  ) as house_heating_energy_kwh,
  -- Count active minutes
  SUM(
    CASE
      WHEN burner_state = 'on' AND (dhw_pump = 'off' OR dhw_pump = '')
      THEN 1
      ELSE 0
    END
  ) as house_heating_active_minutes,
  -- Average temperatures
  AVG(flow_temp) as avg_flow_temp,
  AVG(return_temp) as avg_return_temp,
  AVG(outside_temp) as avg_outside_temp,
  MAX(flow_temp) as max_flow_temp,
  MIN(outside_temp) as min_outside_temp,
  MAX(outside_temp) as max_outside_temp,
  -- Average boiler modulation when house heating is active
  AVG(
    CASE
      WHEN burner_state = 'on' AND (dhw_pump = 'off' OR dhw_pump = '')
      THEN CAST(NULLIF(boiler_modulation, '') AS NUMERIC)
      ELSE NULL
    END
  ) as avg_boiler_modulation,
  MAX(burner_starts) as total_burner_starts,
  COUNT(*) as data_points_count
FROM heating_data
GROUP BY date
HAVING COUNT(*) > 0
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

-- Return count of inserted records
SELECT COUNT(*) as calculated_days FROM house_heating_calculations;

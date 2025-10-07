-- One-time calculation of house heating for all historical heating_data
-- This inserts house heating calculations for all dates that have heating_data

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
  -- Only when burner is on AND DHW pump is off (house heating mode)
  COALESCE(SUM(
    CASE
      WHEN burner_state = 'on' AND (dhw_pump = 'off' OR dhw_pump = '' OR dhw_pump IS NULL)
      THEN (10.0 * CAST(REPLACE(NULLIF(boiler_modulation, ''), '%', '') AS NUMERIC) / 100.0) / 60.0
      ELSE 0
    END
  ), 0) as house_heating_energy_kwh,
  -- Count active minutes (burner on + DHW pump off)
  COALESCE(SUM(
    CASE
      WHEN burner_state = 'on' AND (dhw_pump = 'off' OR dhw_pump = '' OR dhw_pump IS NULL)
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
      WHEN burner_state = 'on' AND (dhw_pump = 'off' OR dhw_pump = '' OR dhw_pump IS NULL)
      THEN CAST(REPLACE(NULLIF(boiler_modulation, ''), '%', '') AS NUMERIC)
      ELSE NULL
    END
  ) as avg_boiler_modulation,
  MAX(COALESCE(burner_starts, 0)) as total_burner_starts,
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

-- Return count of calculated days
SELECT COUNT(*) as total_days_calculated FROM house_heating_calculations;

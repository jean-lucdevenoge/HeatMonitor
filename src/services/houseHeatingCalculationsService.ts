import { supabase } from '../lib/supabase';

export interface HouseHeatingCalculation {
  id: string;
  date: string;
  house_heating_energy_kwh: number;
  house_heating_active_minutes: number;
  avg_flow_temp: number;
  avg_return_temp: number;
  avg_outside_temp: number;
  max_flow_temp: number;
  min_outside_temp: number;
  max_outside_temp: number;
  avg_boiler_modulation: number;
  total_burner_starts: number;
  data_points_count: number;
  created_at: string;
  updated_at: string;
}

export class HouseHeatingCalculationsService {
  static async calculateFromHeatingData(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log('Fetching heating data to calculate house heating...');

      // Fetch all heating data
      const { data: heatingData, error: fetchError } = await supabase
        .from('heating_data')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (fetchError) {
        console.error('Error fetching heating data:', fetchError);
        return { success: false, count: 0, error: fetchError.message };
      }

      if (!heatingData || heatingData.length === 0) {
        return { success: false, count: 0, error: 'No heating data found' };
      }

      console.log(`Processing ${heatingData.length} heating data records...`);

      // Group by date and calculate
      const dailyCalculations = new Map();

      for (const point of heatingData) {
        const dateStr = point.date;

        if (!dailyCalculations.has(dateStr)) {
          dailyCalculations.set(dateStr, {
            date: dateStr,
            total_energy: 0,
            active_minutes: 0,
            flow_temps: [],
            return_temps: [],
            outside_temps: [],
            boiler_modulations: [],
            burner_starts_count: 0,
            data_points: 0,
          });
        }

        const dayCalc = dailyCalculations.get(dateStr);

        // House heating = burner on AND DHW pump off
        const burnerActive = point.burner_state === 'on';
        const dhwPumpOff = !point.dhw_pump || point.dhw_pump === 'off' || point.dhw_pump === '';
        const isHouseHeating = burnerActive && dhwPumpOff;

        if (isHouseHeating) {
          const boilerModulation = parseFloat(point.boiler_modulation) || 0;
          const powerKw = (10 * boilerModulation) / 100;
          const energyKwh = (powerKw * 1) / 60; // Energy per minute

          dayCalc.total_energy += energyKwh;
          dayCalc.active_minutes += 1;
          dayCalc.boiler_modulations.push(boilerModulation);
        }

        dayCalc.flow_temps.push(point.flow_temp || 0);
        dayCalc.return_temps.push(point.return_temp || 0);
        dayCalc.outside_temps.push(point.outside_temp || 0);

        if (point.burner_starts > dayCalc.burner_starts_count) {
          dayCalc.burner_starts_count = point.burner_starts;
        }

        dayCalc.data_points += 1;
      }

      // Prepare records to insert
      const calculationsToInsert = [];

      for (const [dateStr, calc] of dailyCalculations) {
        if (calc.data_points === 0) continue;

        const avgFlowTemp = calc.flow_temps.reduce((a, b) => a + b, 0) / calc.flow_temps.length;
        const avgReturnTemp = calc.return_temps.reduce((a, b) => a + b, 0) / calc.return_temps.length;
        const avgOutsideTemp = calc.outside_temps.reduce((a, b) => a + b, 0) / calc.outside_temps.length;
        const maxFlowTemp = Math.max(...calc.flow_temps);
        const minOutsideTemp = Math.min(...calc.outside_temps);
        const maxOutsideTemp = Math.max(...calc.outside_temps);
        const avgBoilerModulation = calc.boiler_modulations.length > 0
          ? calc.boiler_modulations.reduce((a, b) => a + b, 0) / calc.boiler_modulations.length
          : 0;

        calculationsToInsert.push({
          date: dateStr,
          house_heating_energy_kwh: calc.total_energy,
          house_heating_active_minutes: calc.active_minutes,
          avg_flow_temp: avgFlowTemp,
          avg_return_temp: avgReturnTemp,
          avg_outside_temp: avgOutsideTemp,
          max_flow_temp: maxFlowTemp,
          min_outside_temp: minOutsideTemp,
          max_outside_temp: maxOutsideTemp,
          avg_boiler_modulation: avgBoilerModulation,
          total_burner_starts: calc.burner_starts_count,
          data_points_count: calc.data_points,
        });
      }

      console.log(`Calculated ${calculationsToInsert.length} daily house heating records`);

      // Insert in batches to avoid timeouts
      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < calculationsToInsert.length; i += batchSize) {
        const batch = calculationsToInsert.slice(i, i + batchSize);

        const { error: insertError } = await supabase
          .from('house_heating_calculations')
          .upsert(batch, {
            onConflict: 'date',
          });

        if (insertError) {
          console.error('Error inserting batch:', insertError);
          return { success: false, count: totalInserted, error: insertError.message };
        }

        totalInserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${totalInserted}/${calculationsToInsert.length} records`);
      }

      console.log(`Successfully calculated and inserted ${totalInserted} days of house heating data`);
      return { success: true, count: totalInserted };
    } catch (error) {
      console.error('Error in calculateFromHeatingData:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getAllCalculations(): Promise<HouseHeatingCalculation[]> {
    try {
      console.log('Fetching all house heating calculations from database...');

      const { data, error } = await supabase
        .from('house_heating_calculations')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching house heating calculations:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} house heating calculation records`);
      return data || [];
    } catch (error) {
      console.error('Error in getAllCalculations:', error);
      throw error;
    }
  }

  static async getCalculationsByDateRange(startDate: string, endDate: string): Promise<HouseHeatingCalculation[]> {
    try {
      console.log(`Fetching house heating calculations from ${startDate} to ${endDate}...`);

      const { data, error } = await supabase
        .from('house_heating_calculations')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching house heating calculations by date range:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} house heating calculation records for date range`);
      return data || [];
    } catch (error) {
      console.error('Error in getCalculationsByDateRange:', error);
      throw error;
    }
  }

  static async getCalculationByDate(date: string): Promise<HouseHeatingCalculation | null> {
    try {
      console.log(`Fetching house heating calculation for date: ${date}`);

      const { data, error } = await supabase
        .from('house_heating_calculations')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (error) {
        console.error('Error fetching house heating calculation by date:', error);
        throw error;
      }

      console.log(`Fetched house heating calculation for date: ${date}`);
      return data;
    } catch (error) {
      console.error('Error in getCalculationByDate:', error);
      throw error;
    }
  }

  static async getSummaryStatistics(): Promise<{
    totalDays: number;
    totalHouseHeatingEnergy: number;
    avgDailyEnergy: number;
    avgActiveHours: number;
    avgOutsideTemp: number;
    totalBurnerStarts: number;
  }> {
    try {
      console.log('Calculating summary statistics...');

      const { data, error } = await supabase
        .from('house_heating_calculations')
        .select('house_heating_energy_kwh, house_heating_active_minutes, avg_outside_temp, total_burner_starts');

      if (error) {
        console.error('Error fetching data for summary statistics:', error);
        throw error;
      }

      const calculations = data || [];
      const totalDays = calculations.length;
      const totalHouseHeatingEnergy = calculations.reduce((sum, calc) => sum + calc.house_heating_energy_kwh, 0);
      const totalActiveMinutes = calculations.reduce((sum, calc) => sum + calc.house_heating_active_minutes, 0);
      const avgDailyEnergy = totalDays > 0 ? totalHouseHeatingEnergy / totalDays : 0;
      const avgActiveHours = totalDays > 0 ? (totalActiveMinutes / 60) / totalDays : 0;
      const avgOutsideTemp = totalDays > 0
        ? calculations.reduce((sum, calc) => sum + calc.avg_outside_temp, 0) / totalDays
        : 0;
      const totalBurnerStarts = calculations.reduce((sum, calc) => sum + calc.total_burner_starts, 0);

      const summary = {
        totalDays,
        totalHouseHeatingEnergy,
        avgDailyEnergy,
        avgActiveHours,
        avgOutsideTemp,
        totalBurnerStarts,
      };

      console.log('Summary statistics calculated:', summary);
      return summary;
    } catch (error) {
      console.error('Error in getSummaryStatistics:', error);
      throw error;
    }
  }

  static async getTopHeatingDays(limit: number = 10): Promise<HouseHeatingCalculation[]> {
    try {
      console.log(`Fetching top ${limit} heating days...`);

      const { data, error } = await supabase
        .from('house_heating_calculations')
        .select('*')
        .order('house_heating_energy_kwh', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top heating days:', error);
        throw error;
      }

      console.log(`Fetched top ${data?.length || 0} heating days`);
      return data || [];
    } catch (error) {
      console.error('Error in getTopHeatingDays:', error);
      throw error;
    }
  }
}

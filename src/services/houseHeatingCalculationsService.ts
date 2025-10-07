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

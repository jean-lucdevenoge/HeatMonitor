import { supabase } from '../lib/supabase';

export interface EnergyCalculation {
  id: string;
  date: string;
  solar_energy_kwh: number;
  gas_energy_kwh: number;
  total_energy_kwh: number;
  solar_active_minutes: number;
  gas_active_minutes: number;
  avg_collector_temp: number;
  avg_dhw_temp: number;
  avg_outside_temp: number;
  max_collector_temp: number;
  max_dhw_temp: number;
  min_outside_temp: number;
  max_outside_temp: number;
  avg_water_pressure: number;
  data_points_count: number;
  created_at: string;
  updated_at: string;
}

export class EnergyCalculationsService {
  // Get all energy calculations
  static async getAllCalculations(): Promise<EnergyCalculation[]> {
    try {
      console.log('Fetching all energy calculations from database...');
      
      const { data, error } = await supabase
        .from('energy_calculations')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching energy calculations:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} energy calculation records`);
      return data || [];
    } catch (error) {
      console.error('Error in getAllCalculations:', error);
      throw error;
    }
  }

  // Get energy calculations for a specific date range
  static async getCalculationsByDateRange(startDate: string, endDate: string): Promise<EnergyCalculation[]> {
    try {
      console.log(`Fetching energy calculations from ${startDate} to ${endDate}...`);
      
      const { data, error } = await supabase
        .from('energy_calculations')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching energy calculations by date range:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} energy calculation records for date range`);
      return data || [];
    } catch (error) {
      console.error('Error in getCalculationsByDateRange:', error);
      throw error;
    }
  }

  // Get energy calculation for a specific date
  static async getCalculationByDate(date: string): Promise<EnergyCalculation | null> {
    try {
      console.log(`Fetching energy calculation for date: ${date}`);
      
      const { data, error } = await supabase
        .from('energy_calculations')
        .select('*')
        .eq('date', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          console.log(`No energy calculation found for date: ${date}`);
          return null;
        }
        console.error('Error fetching energy calculation by date:', error);
        throw error;
      }

      console.log(`Fetched energy calculation for date: ${date}`);
      return data;
    } catch (error) {
      console.error('Error in getCalculationByDate:', error);
      throw error;
    }
  }

  // Get summary statistics
  static async getSummaryStatistics(): Promise<{
    totalDays: number;
    totalSolarEnergy: number;
    totalGasEnergy: number;
    totalCombinedEnergy: number;
    avgDailyEnergy: number;
    solarPercentage: number;
    gasPercentage: number;
  }> {
    try {
      console.log('Calculating summary statistics...');
      
      const { data, error } = await supabase
        .from('energy_calculations')
        .select('solar_energy_kwh, gas_energy_kwh, total_energy_kwh');

      if (error) {
        console.error('Error fetching data for summary statistics:', error);
        throw error;
      }

      const calculations = data || [];
      const totalDays = calculations.length;
      const totalSolarEnergy = calculations.reduce((sum, calc) => sum + calc.solar_energy_kwh, 0);
      const totalGasEnergy = calculations.reduce((sum, calc) => sum + calc.gas_energy_kwh, 0);
      const totalCombinedEnergy = calculations.reduce((sum, calc) => sum + calc.total_energy_kwh, 0);
      const avgDailyEnergy = totalDays > 0 ? totalCombinedEnergy / totalDays : 0;
      const solarPercentage = totalCombinedEnergy > 0 ? (totalSolarEnergy / totalCombinedEnergy) * 100 : 0;
      const gasPercentage = totalCombinedEnergy > 0 ? (totalGasEnergy / totalCombinedEnergy) * 100 : 0;

      const summary = {
        totalDays,
        totalSolarEnergy,
        totalGasEnergy,
        totalCombinedEnergy,
        avgDailyEnergy,
        solarPercentage,
        gasPercentage,
      };

      console.log('Summary statistics calculated:', summary);
      return summary;
    } catch (error) {
      console.error('Error in getSummaryStatistics:', error);
      throw error;
    }
  }

  // Get top energy days
  static async getTopEnergyDays(limit: number = 10): Promise<EnergyCalculation[]> {
    try {
      console.log(`Fetching top ${limit} energy days...`);
      
      const { data, error } = await supabase
        .from('energy_calculations')
        .select('*')
        .order('total_energy_kwh', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top energy days:', error);
        throw error;
      }

      console.log(`Fetched top ${data?.length || 0} energy days`);
      return data || [];
    } catch (error) {
      console.error('Error in getTopEnergyDays:', error);
      throw error;
    }
  }

  // Delete all energy calculations (for testing purposes)
  static async deleteAllCalculations(): Promise<void> {
    try {
      console.log('Deleting all energy calculations...');
      
      const { error } = await supabase
        .from('energy_calculations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error deleting all energy calculations:', error);
        throw error;
      }

      console.log('All energy calculations deleted');
    } catch (error) {
      console.error('Error in deleteAllCalculations:', error);
      throw error;
    }
  }
}
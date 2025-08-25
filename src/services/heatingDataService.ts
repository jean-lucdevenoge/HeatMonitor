import { supabase, HeatingDataRow } from '../lib/supabase';
import { HeatingDataPoint } from '../types/HeatingData';

export class HeatingDataService {
  // Convert database row to HeatingDataPoint
  private static dbRowToDataPoint(row: HeatingDataRow): HeatingDataPoint {
    return {
      date: row.date,
      time: row.time,
      collectorTemp: row.collector_temp,
      outsideTemp: row.outside_temp,
      dhwTempTop: row.dhw_temp_top,
      dhwTempBottom: row.dhw_temp_bottom,
      flowTemp: row.flow_temp,
      flowTempSetpoint: row.flow_temp_setpoint,
      burnerStarts: row.burner_starts,
      boilerModulation: row.boiler_modulation,
      fanControl: row.fan_control,
      collectorPump: row.collector_pump,
      boilerPump: row.boiler_pump,
      burnerState: row.burner_state,
      solarStatus: row.solar_status,
      waterPressure: row.water_pressure,
      dhwPump: row.dhw_pump,
      fanSpeed: row.fan_speed,
      returnTemp: row.return_temp,
      boilerPumpSpeed: row.boiler_pump_speed,
      sensorTemp: row.sensor_temp,
    };
  }

  // Convert HeatingDataPoint to database row
  private static dataPointToDbRow(point: HeatingDataPoint): Omit<HeatingDataRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      date: point.date,
      time: point.time,
      collector_temp: point.collectorTemp,
      outside_temp: point.outsideTemp,
      dhw_temp_top: point.dhwTempTop,
      dhw_temp_bottom: point.dhwTempBottom,
      flow_temp: point.flowTemp,
      flow_temp_setpoint: point.flowTempSetpoint,
      burner_starts: point.burnerStarts,
      boiler_modulation: point.boilerModulation,
      fan_control: point.fanControl,
      collector_pump: point.collectorPump,
      boiler_pump: point.boilerPump,
      burner_state: point.burnerState,
      solar_status: point.solarStatus,
      water_pressure: point.waterPressure,
      dhw_pump: point.dhwPump,
      fan_speed: point.fanSpeed,
      return_temp: point.returnTemp,
      boiler_pump_speed: point.boilerPumpSpeed,
      sensor_temp: point.sensorTemp,
    };
  }

// Get all heating data from database
static async getAllData(): Promise<HeatingDataPoint[]> {
  console.log('Fetching all heating data from database...');
  const { data, error } = await supabase
    .from('heating_data')
    .select('*')
    .order('date', { ascending: true, nullsLast: true })
    .order('time', { ascending: true, nullsLast: true });

  if (error) {
    console.error('Error fetching heating data:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log('Total records: 0');
    return [];
  }

  const dataPoints = data.map(this.dbRowToDataPoint);

  console.log(`Total records: ${dataPoints.length}`);
  console.log('First record:', dataPoints[0]);
  console.log('Last record:', dataPoints[dataPoints.length - 1]);

  return dataPoints;
}

  // Insert heating data points into database
  static async insertData(dataPoints: HeatingDataPoint[]): Promise<{ inserted: number; duplicates: number }> {
    try {
      console.log(`Inserting ${dataPoints.length} data points...`);
      
      // Convert to database format
      const dbRows = dataPoints.map(this.dataPointToDbRow);
      
      const { data, error } = await supabase
        .from('heating_data')
        .upsert(dbRows, {
          onConflict: 'date,time',
          ignoreDuplicates: true 
        })
        .select('id');

      if (error) {
        console.error('Error inserting heating data:', error);
        throw error;
      }

      const inserted = data?.length || 0;
      const duplicates = dataPoints.length - inserted;

      console.log(`Inserted ${inserted} new records, ${duplicates} duplicates skipped`);
      
      return { inserted, duplicates };
    } catch (error) {
      console.error('Error in insertData:', error);
      throw error;
    }
  }

  // Check if data exists for a specific date range
  static async checkDataExists(startDate: string, endDate: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('heating_data')
        .select('id')
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(1);

      if (error) {
        console.error('Error checking data existence:', error);
        return false;
      }

      return data.length > 0;
    } catch (error) {
      console.error('Error in checkDataExists:', error);
      return false;
    }
  }

  // Get data count
  static async getDataCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('heating_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting data count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getDataCount:', error);
      return 0;
    }
  }

  // Delete all data (for testing purposes)
  static async deleteAllData(): Promise<void> {
    try {
      const { error } = await supabase
        .from('heating_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error deleting all data:', error);
        throw error;
      }

      console.log('All heating data deleted');
    } catch (error) {
      console.error('Error in deleteAllData:', error);
      throw error;
    }
  }
}
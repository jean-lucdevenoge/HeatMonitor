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
    try {
      // Get all data first to see what we have
      console.log('Fetching all heating data from database...');

      const { data, error } = await supabase
        .from('heating_data')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching heating data:', error);
        throw error;
      }

      console.log(`Total records in database: ${data.length}`);
      if (data.length > 0) {
        console.log('Date range in database:', {
          first: `${data[0].date} ${data[0].time}`,
          last: `${data[data.length - 1].date} ${data[data.length - 1].time}`
        });
      }

      const dataPoints = data.map(this.dbRowToDataPoint);
      
      // Sort by date and time to ensure proper chronological order
      const sortedData = dataPoints.sort((a, b) => {
        // Convert DD.MM.YYYY to YYYY-MM-DD for proper sorting
        const dateA = a.date.split('.').reverse().join('-');
        const dateB = b.date.split('.').reverse().join('-');
        
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        
        // If dates are the same, sort by time
        return a.time.localeCompare(b.time);
      });
      
      // Now filter to past 3 days after sorting
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
      
      const filteredData = sortedData.filter(point => {
        const [day, month, year] = point.date.split('.');
        const [hours, minutes] = point.time.split(':');
        const pointDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
        return pointDate >= threeDaysAgo;
      });
      
      console.log(`Filtered to past 3 days: ${filteredData.length} records`);
      if (filteredData.length > 0) {
        console.log('Filtered date range:', {
          first: `${filteredData[0].date} ${filteredData[0].time}`,
          last: `${filteredData[filteredData.length - 1].date} ${filteredData[filteredData.length - 1].time}`
        });
      }
      
      return filteredData;
    } catch (error) {
      console.error('Error in getAllData:', error);
      throw error;
    }
  }

  // Insert heating data into database
  static async insertData(dataPoints: HeatingDataPoint[]): Promise<{ inserted: number; duplicates: number }> {
    try {
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
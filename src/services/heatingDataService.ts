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
  
  // Get total count first
  const { count, error: countError } = await supabase
    .from('heating_data')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting count:', countError);
    throw countError;
  }

  console.log(`Total records in database: ${count}`);

  // Fetch all data at once - Supabase can handle large datasets
  const { data, error } = await supabase
    .from('heating_data')
    .select('*')
    .order('date')
    .order('time');

  if (error) {
    console.error('Error fetching all data:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    console.log('Total records: 0');
    return [];
  }

  console.log('RAW DATABASE DATA (first 5):');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`${i}: ${row.date} ${row.time}`);
  });
  
  console.log('RAW DATABASE DATA (last 5):');
  data.slice(-5).forEach((row, i) => {
    console.log(`${data.length - 5 + i}: ${row.date} ${row.time}`);
  });
  
  console.log('RAW DATABASE DATA (first 5):');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`${i}: ${row.date} ${row.time}`);
  });
  
  console.log('RAW DATABASE DATA (last 5):');
  data.slice(-5).forEach((row, i) => {
    console.log(`${data.length - 5 + i}: ${row.date} ${row.time}`);
  });
  // Convert to data points and sort properly by date/time
  const dataPoints = data.map(this.dbRowToDataPoint);
  
  // Sort properly by converting DD.MM.YYYY to comparable format
  dataPoints.sort((a, b) => {
    // Convert DD.MM.YYYY to YYYY-MM-DD for proper comparison
    const dateA = a.date.split('.').reverse().join('-');
    const dateB = b.date.split('.').reverse().join('-');
    
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    
    // If dates are the same, sort by time
    return a.time.localeCompare(b.time);
  });

  console.log('AFTER JAVASCRIPT SORTING (first 5):');
  dataPoints.slice(0, 5).forEach((point, i) => {
    console.log(`${i}: ${point.date} ${point.time}`);
  });
  
  console.log('AFTER JAVASCRIPT SORTING (last 5):');
  dataPoints.slice(-5).forEach((point, i) => {
    console.log(`${dataPoints.length - 5 + i}: ${point.date} ${point.time}`);
  });
  
  console.log('AFTER JAVASCRIPT SORTING (first 5):');
  dataPoints.slice(0, 5).forEach((point, i) => {
    console.log(`${i}: ${point.date} ${point.time}`);
  });
  
  return dataPoints;
}

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
      console.log('Getting total count from database...');
      const { count, error } = await supabase
        .from('heating_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting data count:', error);
        return 0;
      }

      console.log(`Database reports ${count} total records`);
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

  // Get data by date range (YYYY-MM-DD format)
  static async getDataByDateRange(startDate: string, endDate: string): Promise<HeatingDataPoint[]> {
    console.log(`Fetching data for date range: ${startDate} to ${endDate}`);
    
    // Convert YYYY-MM-DD to DD.MM.YYYY for database comparison
    const convertToDbFormat = (dateStr: string): string => {
      const [year, month, day] = dateStr.split('-');
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    };
    
    const dbStartDate = convertToDbFormat(startDate);
    const dbEndDate = convertToDbFormat(endDate);
    
    console.log(`Converted to DB format: ${dbStartDate} to ${dbEndDate}`);
    
    try {
      // Fetch all data at once - no limits
      const { data, error } = await supabase
        .from('heating_data')
        .select('*')
        .order('date')
        .order('time');

      if (error) {
        console.error('Error fetching data by date range:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No data found in database');
        return [];
      }

      console.log(`Fetched ${data.length} total records, now filtering by date range...`);
      
      // Convert to data points
      const dataPoints = data.map(this.dbRowToDataPoint);
      
      // Filter by date range in JavaScript
      const filteredDataPoints = dataPoints.filter(point => {
        // Convert DD.MM.YYYY to Date object for proper comparison
        const [day, month, year] = point.date.split('.');
        const pointDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Convert YYYY-MM-DD to Date object
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        return pointDate >= startDateObj && pointDate <= endDateObj;
      });
      
      console.log(`Filtered to ${filteredDataPoints.length} records within date range ${startDate} to ${endDate}`);
      
      // Sort properly by converting DD.MM.YYYY to comparable format
      filteredDataPoints.sort((a, b) => {
        // Convert DD.MM.YYYY to YYYY-MM-DD for proper comparison
        const dateA = a.date.split('.').reverse().join('-');
        const dateB = b.date.split('.').reverse().join('-');
        
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        
        // If dates are the same, sort by time
        return a.time.localeCompare(b.time);
      });

      console.log(`Sorted ${filteredDataPoints.length} data points by date/time`);
      if (filteredDataPoints.length > 0) {
        console.log('First record:', filteredDataPoints[0]);
        console.log('Last record:', filteredDataPoints[filteredDataPoints.length - 1]);
      } else {
        console.log('No records found in the specified date range');
        
        // Debug: Show available date range
        if (dataPoints.length > 0) {
          const firstDate = dataPoints[0].date;
          const lastDate = dataPoints[dataPoints.length - 1].date;
          console.log(`Available data range: ${firstDate} to ${lastDate}`);
        }
      }

      return filteredDataPoints;
    } catch (error) {
      console.error('Error in getDataByDateRange:', error);
      throw error;
    }
  }

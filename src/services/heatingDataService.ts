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
      .order('created_at');

    if (error) {
      console.error('Error fetching all data:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      console.log('Total records: 0');
      return [];
    }

    console.log(`Fetched ${data.length} records from database`);
    console.log('First record:', data[0]?.date, data[0]?.time);
    console.log('Last record:', data[data.length - 1]?.date, data[data.length - 1]?.time);
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

    console.log('After sorting - First record:', dataPoints[0]?.date, dataPoints[0]?.time);
    console.log('After sorting - Last record:', dataPoints[dataPoints.length - 1]?.date, dataPoints[dataPoints.length - 1]?.time);
    
    return dataPoints;
  }

  // Get data filtered by date range
  static async getDataByDateRange(startDate: string, endDate: string): Promise<HeatingDataPoint[]> {
    try {
      console.log(`Getting data from ${startDate} to ${endDate}`);
      
      // Get all data first
      const allData = await this.getAllData();
      console.log(`Total data points available: ${allData.length}`);
      
      // Convert startDate and endDate from YYYY-MM-DD to DD.MM.YYYY for comparison
      const [startYear, startMonth, startDay] = startDate.split('-');
      const [endYear, endMonth, endDay] = endDate.split('-');
      const startDateFormatted = `${startDay}.${startMonth}.${startYear}`;
      const endDateFormatted = `${endDay}.${endMonth}.${endYear}`;
      
      console.log(`Converted dates: ${startDateFormatted} to ${endDateFormatted}`);
      
      // Filter data points based on date range
      const filteredData = allData.filter(point => {
        // Convert DD.MM.YYYY to YYYY-MM-DD for comparison
        const [day, month, year] = point.date.split('.');
        const pointDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const isInRange = pointDateFormatted >= startDate && pointDateFormatted <= endDate;
        
        // Debug first few points
        if (index < 5) {
          console.log(`Point ${index}: ${point.date} -> ${pointDateFormatted}, range: ${startDate} to ${endDate}, inRange: ${isInRange}`);
        }
        
        return isInRange;
      });
      
      console.log(`Filtered ${filteredData.length} data points from ${allData.length} total`);
      
      if (filteredData.length > 0) {
        console.log(`First filtered record: ${filteredData[0].date} ${filteredData[0].time}`);
        console.log(`Last filtered record: ${filteredData[filteredData.length - 1].date} ${filteredData[filteredData.length - 1].time}`);
      } else {
        console.log('No data found in the specified date range');
        // Show some sample dates from the database for debugging
        console.log('Sample dates in database:');
        allData.slice(0, 10).forEach(point => {
          const [day, month, year] = point.date.split('.');
          const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log(`  ${point.date} -> ${formatted}, comparing with range ${startDate} to ${endDate}`);
        });
      }
      
      return filteredData;
    } catch (error) {
      console.error('Error in getDataByDateRange:', error);
      throw error;
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
        console.error('Error getting count:', error);
        throw error;
      }

      console.log(`Total records in database: ${count}`);
      return count || 0;
    } catch (error) {
      console.error('Error in getDataCount:', error);
      throw error;
    }
  }
}
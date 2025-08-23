import Papa from 'papaparse';
import { HeatingDataPoint, SystemMetrics } from '../types/HeatingData';

export const parseHeatingCSV = (csvContent: string): HeatingDataPoint[] => {
  const lines = csvContent.split('\n');
  
  // Find the start of actual data (after the header information)
  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Date;Time of day;')) {
      dataStartIndex = i + 1;
      break;
    }
  }
  
  if (dataStartIndex === -1) return [];
  
  // Extract data rows
  const dataLines = lines.slice(dataStartIndex).filter(line => 
    line.trim() && line.includes(';') && line.match(/^\d{2}\.\d{2}\.\d{4}/)
  );
  
  return dataLines.map(line => {
    const values = line.split(';').map(v => v.trim());
    
    return {
      date: values[0] || '',
      time: values[1] || '',
      collectorTemp: parseFloat(values[2]) || 0,
      outsideTemp: parseFloat(values[3]) || 0,
      dhwTempTop: parseFloat(values[4]) || 0,
      dhwTempBottom: parseFloat(values[5]) || 0,
      flowTemp: parseFloat(values[6]) || 0,
      flowTempSetpoint: parseFloat(values[7]) || 0,
      burnerStarts: parseInt(values[8]) || 0,
      boilerModulation: values[9] || '',
      fanControl: parseFloat(values[10]) || 0,
      collectorPump: values[11] || '',
      boilerPump: values[12] || '',
      burnerState: values[13] || '',
      solarStatus: values[14] || '',
      waterPressure: parseFloat(values[15]) || 0,
      dhwPump: values[16] || '',
      fanSpeed: parseInt(values[17]) || 0,
      returnTemp: parseFloat(values[18]) || 0,
      boilerPumpSpeed: parseInt(values[19]) || 0,
      sensorTemp: parseFloat(values[20]) || 0,
    };
  });
};

export const calculateMetrics = (data: HeatingDataPoint[]): SystemMetrics => {
  if (data.length === 0) {
    return {
      totalBurnerStarts: 0,
      avgCollectorTemp: 0,
      maxOutsideTemp: 0,
      maxDhwTemp: 0,
      avgWaterPressure: 0,
      solarActiveHours: 0,
      gasActiveHours: 0,
    };
  }

  const validTemps = data.filter(d => d.collectorTemp > 0);
  const validOutside = data.filter(d => d.outsideTemp > 0);
  const validPressure = data.filter(d => d.waterPressure > 0);
  
  const solarActiveCount = data.filter(d => 
    d.solarStatus.includes('Charging') || d.collectorPump === 'On'
  ).length;
  
  const gasActiveCount = data.filter(d => 
    d.burnerState.includes('operation') || d.boilerModulation !== '----'
  ).length;

  return {
    totalBurnerStarts: Math.max(...data.map(d => d.burnerStarts)) - Math.min(...data.map(d => d.burnerStarts)),
    avgCollectorTemp: validTemps.reduce((sum, d) => sum + d.collectorTemp, 0) / validTemps.length,
    maxOutsideTemp: Math.max(...data.map(d => d.outsideTemp)),
    maxDhwTemp: Math.max(...data.map(d => d.dhwTempTop)),
    avgWaterPressure: validPressure.reduce((sum, d) => sum + d.waterPressure, 0) / validPressure.length,
    solarActiveHours: solarActiveCount / 60, // Convert minutes to hours
    gasActiveHours: gasActiveCount / 60,
  };
};

export const formatTime = (timeStr: string): string => {
  return timeStr.substring(0, 5); // HH:MM format
};

export const getStatusColor = (status: string): string => {
  if (status.includes('operation') || status.includes('Charging')) return 'text-green-600';
  if (status.includes('Standby')) return 'text-yellow-600';
  if (status.includes('insufficient')) return 'text-red-600';
  return 'text-gray-600';
};
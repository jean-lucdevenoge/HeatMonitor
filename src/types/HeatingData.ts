export interface HeatingDataPoint {
  date: string;
  time: string;
  collectorTemp: number;
  outsideTemp: number;
  dhwTempTop: number;
  dhwTempBottom: number;
  flowTemp: number;
  flowTempSetpoint: number;
  burnerStarts: number;
  boilerModulation: string;
  fanControl: number;
  collectorPump: string;
  boilerPump: string;
  burnerState: string;
  solarStatus: string;
  waterPressure: number;
  dhwPump: string;
  fanSpeed: number;
  returnTemp: number;
  boilerPumpSpeed: number;
  sensorTemp: number;
}

export interface SystemMetrics {
  totalBurnerStarts: number;
  avgCollectorTemp: number;
  maxOutsideTemp: number;
  maxDhwTemp: number;
  avgWaterPressure: number;
  solarActiveHours: number;
  gasActiveHours: number;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension?: number;
  yAxisID?: string;
}
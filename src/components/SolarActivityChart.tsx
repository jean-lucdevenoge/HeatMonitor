import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { getRelativePosition } from 'chart.js/helpers';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { HeatingDataPoint } from '../types/HeatingData';
import { useLanguage } from '../contexts/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

interface SolarActivityChartProps {
  data: HeatingDataPoint[];
}

export const SolarActivityChart: React.FC<SolarActivityChartProps> = ({ data }) => {
  const { t } = useLanguage();
  
  const [startMarker, setStartMarker] = React.useState<number | null>(null);
  const [endMarker, setEndMarker] = React.useState<number | null>(null);
  const [isMarkingMode, setIsMarkingMode] = React.useState(false);
  const [zoomRange, setZoomRange] = React.useState<{min: number, max: number} | null>(null);

  // Sample every 5th point for better performance
  const sampledData = data.filter((_, index) => index % 5 === 0);
  
  // Convert date/time to proper Date objects
  const chartLabels = sampledData.map(d => {
    const [day, month, year] = d.date.split('.');
    const [hours, minutes] = d.time.split(':');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  });

  // Determine solar activity status
  const solarActivity = sampledData.map(d => {
    const isSolarActive = d.solarStatus.includes('Charging') || 
                         d.collectorPump === 'On' || 
                         d.collectorTemp > d.dhwTempTop + 5;
    return isSolarActive ? 1 : 0;
  });

  // Custom plugin to draw solar activity background
  const solarBackgroundPlugin = {
    id: 'solarBackground',
    beforeDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;

      ctx.save();
      
      // Get the visible time range
      const xScale = scales.x;
      const minTime = xScale.min;
      const maxTime = xScale.max;
      
      // Find visible data points
      const visibleIndices: number[] = [];
      chartLabels.forEach((label, index) => {
        const time = label.getTime();
        if (time >= minTime && time <= maxTime) {
          visibleIndices.push(index);
        }
      });

      // Draw background rectangles for solar active periods
      let activeStart = -1;
      
      for (let i = 0; i < visibleIndices.length; i++) {
        const index = visibleIndices[i];
        const isActive = solarActivity[index] === 1;
        const time = chartLabels[index].getTime();
        const x = xScale.getPixelForValue(time);
        
        if (isActive && activeStart === -1) {
          // Start of active period
          activeStart = x;
        } else if (!isActive && activeStart !== -1) {
          // End of active period
          ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
          ctx.fillRect(activeStart, chartArea.top, x - activeStart, chartArea.height);
          activeStart = -1;
        }
      }
      
      // Handle case where active period extends to the end
      if (activeStart !== -1) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
        ctx.fillRect(activeStart, chartArea.top, chartArea.right - activeStart, chartArea.height);
      }
      
      ctx.restore();
    }
  };

  // Custom plugin to draw markers
  const markersPlugin = {
    id: 'markers',
    afterDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;

      ctx.save();
      
      // Draw start marker
      if (startMarker !== null && startMarker < chartLabels.length) {
        const time = chartLabels[startMarker].getTime();
        const x = scales.x.getPixelForValue(time);
        
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        
        // Draw start label
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('START', x + 5, chartArea.top + 15);
      }
      
      // Draw end marker
      if (endMarker !== null && endMarker < chartLabels.length) {
        const time = chartLabels[endMarker].getTime();
        const x = scales.x.getPixelForValue(time);
        
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        
        // Draw end label
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('END', x + 5, chartArea.top + 30);
      }
      
      ctx.restore();
    }
  };

  // Handle chart click for marking
  const handleChartClick = (event: any, elements: any, chart: any) => {
    if (!isMarkingMode) return;
    
    const canvasPosition = getRelativePosition(event, chart);
    const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
    
    // Find closest data point
    let closestIndex = 0;
    let minDistance = Math.abs(chartLabels[0].getTime() - dataX);
    
    for (let i = 1; i < chartLabels.length; i++) {
      const distance = Math.abs(chartLabels[i].getTime() - dataX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    if (startMarker === null) {
      setStartMarker(closestIndex);
    } else if (endMarker === null) {
      setEndMarker(closestIndex);
      setIsMarkingMode(false);
    }
  };

  // Handle zoom change to update visible data statistics
  const handleZoomChange = (chart: any) => {
    const xScale = chart.scales?.x;
    if (xScale) {
      const minTime = xScale.min;
      const maxTime = xScale.max;
      setZoomRange({ min: minTime, max: maxTime });
    }
  };

  // Calculate statistics for visible data range
  const getVisibleDataStats = () => {
    if (!zoomRange) {
      // Return full dataset stats
      const totalPoints = sampledData.length;
      const activePoints = solarActivity.filter(status => status === 1).length;
      const solarEfficiencyPercent = totalPoints > 0 ? (activePoints / totalPoints * 100).toFixed(1) : '0';
      return { activePoints, totalPoints, solarEfficiencyPercent };
    }

    // Filter data for visible range
    const visibleIndices: number[] = [];
    chartLabels.forEach((label, index) => {
      const time = label.getTime();
      if (time >= zoomRange.min && time <= zoomRange.max) {
        visibleIndices.push(index);
      }
    });

    const visibleActivePoints = visibleIndices.filter(index => solarActivity[index] === 1).length;
    const visibleTotalPoints = visibleIndices.length;
    const visibleSolarEfficiencyPercent = visibleTotalPoints > 0 ? (visibleActivePoints / visibleTotalPoints * 100).toFixed(1) : '0';

    return { 
      activePoints: visibleActivePoints, 
      totalPoints: visibleTotalPoints, 
      solarEfficiencyPercent: visibleSolarEfficiencyPercent 
    };
  };

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('chart.collectorTempB6'),
        data: sampledData.map(d => d.collectorTemp),
        borderColor: '#EAB308',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: t('chart.dhwTemp'),
        data: sampledData.map(d => d.dhwTempTop),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: t('chart.b31Temp'),
        data: sampledData.map(d => d.sensorTemp),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: t('chart.solarActivity'),
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          afterTitle: function(tooltipItems: any) {
            const index = tooltipItems[0].dataIndex;
            const isActive = solarActivity[index] === 1;
            return isActive ? '🌞 Solar: Active' : '🌙 Solar: Inactive';
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`;
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: !isMarkingMode,
          },
          pinch: {
            enabled: !isMarkingMode,
          },
          mode: 'x',
          onZoomComplete: handleZoomChange,
        },
        pan: {
          enabled: !isMarkingMode,
          mode: 'x',
          onPanComplete: handleZoomChange,
        },
        limits: {
          x: { min: 'original', max: 'original' },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        title: {
          display: true,
          text: t('chart.temperatureAxis'),
        },
      },
    },
  };

  const resetZoom = () => {
    const chartInstance = ChartJS.getChart('solar-activity-chart');
    if (chartInstance) {
      chartInstance.resetZoom();
      setZoomRange(null);
    }
  };

  const clearMarkers = () => {
    setStartMarker(null);
    setEndMarker(null);
    setIsMarkingMode(false);
  };

  const startMarking = () => {
    clearMarkers();
    setIsMarkingMode(true);
  };

  // Calculate statistics for marked period
  const getMarkedPeriodStats = () => {
    if (startMarker === null || endMarker === null) return null;
    
    const start = Math.min(startMarker, endMarker);
    const end = Math.max(startMarker, endMarker);
    const markedData = sampledData.slice(start, end + 1);
    const markedActivity = solarActivity.slice(start, end + 1);
    
    const activePoints = markedActivity.filter(status => status === 1).length;
    const totalPoints = markedData.length;
    const activePercent = totalPoints > 0 ? (activePoints / totalPoints * 100).toFixed(1) : '0';
    
    // Calculate average temperatures during marked period
    const avgCollectorTemp = markedData.reduce((sum, d) => sum + d.collectorTemp, 0) / markedData.length;
    const avgDhwTemp = markedData.reduce((sum, d) => sum + d.dhwTempTop, 0) / markedData.length;
    const avgSensorTemp = markedData.reduce((sum, d) => sum + d.sensorTemp, 0) / markedData.length;
    
    return {
      startTime: `${markedData[0].date} ${markedData[0].time}`,
      endTime: `${markedData[markedData.length - 1].date} ${markedData[markedData.length - 1].time}`,
      activePercent,
      duration: `${Math.round((end - start) * 5)} minutes`, // Assuming 5-minute intervals
      avgCollectorTemp: avgCollectorTemp.toFixed(1),
      avgDhwTemp: avgDhwTemp.toFixed(1),
      avgSensorTemp: avgSensorTemp.toFixed(1),
    };
  };

  const markedStats = getMarkedPeriodStats();

  // Calculate solar statistics for visible range
  const visibleStats = getVisibleDataStats();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t('chart.solarActivity')}</h3>
          <p className="text-sm text-gray-600">
            {t('chart.solarActivePercent')}: {visibleStats.solarEfficiencyPercent}% ({visibleStats.activePoints}/{visibleStats.totalPoints} {t('chart.dataPoints')})
            {zoomRange && <span className="ml-2 text-blue-600 font-medium">(Zoomed View)</span>}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={startMarking}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              isMarkingMode 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isMarkingMode ? t('button.clickToMark') : t('button.markPeriod')}
          </button>
          <button
            onClick={clearMarkers}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            {t('button.clearMarkers')}
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            {t('button.resetZoom')}
          </button>
        </div>
      </div>
      
      {isMarkingMode && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            📍 {t('chart.markingModeActive')}: {startMarker === null ? t('chart.startMarker') : t('chart.endMarker')}
          </p>
        </div>
      )}
      
      {markedStats && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">{t('chart.markedPeriodAnalysis')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-blue-600 font-medium">{t('chart.start')}:</span>
              <p className="text-blue-800">{markedStats.startTime}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.end')}:</span>
              <p className="text-blue-800">{markedStats.endTime}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.duration')}:</span>
              <p className="text-blue-800">{markedStats.duration}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.solarActive')}:</span>
              <p className="text-blue-800 font-semibold">{markedStats.activePercent}%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-3">
            <div>
              <span className="text-blue-600 font-medium">{t('chart.avgCollectorTemp')}:</span>
              <p className="text-blue-800">{markedStats.avgCollectorTemp}°C</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.avgDhwTemp')}:</span>
              <p className="text-blue-800">{markedStats.avgDhwTemp}°C</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.avgB31Temp')}:</span>
              <p className="text-blue-800">{markedStats.avgSensorTemp}°C</p>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ height: '400px' }}>
        <Line 
          id="solar-activity-chart" 
          data={chartData} 
          options={options}
          plugins={[solarBackgroundPlugin, markersPlugin]}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="font-medium">{t('chart.solarActiveBackground')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.solarActiveBackgroundDesc')}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="font-medium">{t('chart.collectorTempB6Legend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.collectorTempB6Desc')}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="font-medium">{t('chart.dhwTempLegend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.dhwTempDesc')}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span className="font-medium">{t('chart.b31TempLegend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.b31TempDesc')}</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        {t('chart.zoomInstructions')}
      </div>
    </div>
  );
};
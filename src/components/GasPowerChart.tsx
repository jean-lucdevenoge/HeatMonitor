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

interface GasPowerChartProps {
  data: HeatingDataPoint[];
}

export const GasPowerChart: React.FC<GasPowerChartProps> = ({ data }) => {
  const { t } = useLanguage();
  
  const [startMarker, setStartMarker] = React.useState<number | null>(null);
  const [endMarker, setEndMarker] = React.useState<number | null>(null);
  const [isMarkingMode, setIsMarkingMode] = React.useState(false);
  const zoomRangeRef = React.useRef<{min: number, max: number} | null>(null);

  // Sample every 5th point for better performance
  const sampledData = data.filter((_, index) => index % 5 === 0);
  
  // Convert date/time to proper Date objects
  const chartLabels = sampledData.map(d => {
    const [day, month, year] = d.date.split('.');
    const [hours, minutes] = d.time.split(':');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  });

  // Determine gas activity status (when DHW pump is on)
  const gasActivity = sampledData.map(d => {
    const isGasActive = d.dhwPump === 'On';
    return isGasActive ? 1 : 0;
  });

  // Calculate gas power (10 kW * Boiler Modulation when DHW pump is on)
  const gasPower = sampledData.map((d, index) => {
    const isGasActive = gasActivity[index] === 1;
    
    if (!isGasActive) return 0; // No gas power when DHW pump is off
    
    // Parse boiler modulation percentage
    let modulation = 0;
    if (d.boilerModulation && d.boilerModulation !== '----') {
      const modulationStr = d.boilerModulation.replace('%', '').trim();
      modulation = parseFloat(modulationStr) || 0;
    }
    
    // Gas power: 10 kW * (modulation percentage / 100)
    const power = 10 * (modulation / 100);
    return power;
  });

  // Calculate cumulative gas energy (kWh)
  let cumulativeGasEnergy = 0;
  const gasEnergy = [];

  for (let i = 0; i < gasPower.length; i++) {
    // Assuming each data point represents 1 minute interval
    const timeInterval = 1 / 60; // hours
    cumulativeGasEnergy += gasPower[i] * timeInterval;
    gasEnergy.push(cumulativeGasEnergy);
  }

  // Get boiler modulation values for display
  const boilerModulation = sampledData.map(d => {
    if (d.boilerModulation && d.boilerModulation !== '----') {
      const modulationStr = d.boilerModulation.replace('%', '').trim();
      return parseFloat(modulationStr) || 0;
    }
    return 0;
  });

  // Custom plugin to draw gas activity background
  const gasBackgroundPlugin = {
    id: 'gasBackground',
    beforeDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;

      ctx.save();
      
      // Get the visible time range
      const xScale = scales.x;
      const minTime = xScale.min;
      const maxTime = xScale.max;
      
      // Draw background rectangles for gas active periods
      let activeStart = -1;
      
      for (let i = 0; i < chartLabels.length; i++) {
        const time = chartLabels[i].getTime();
        const isActive = gasActivity[i] === 1;
        const x = xScale.getPixelForValue(time);
        
        // Only process points within visible range
        if (time < minTime || time > maxTime) continue;
        
        if (isActive && activeStart === -1) {
          // Start of active period
          activeStart = x;
        } else if (!isActive && activeStart !== -1) {
          // End of active period
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(activeStart, chartArea.top, x - activeStart, chartArea.height);
          activeStart = -1;
        }
      }
      
      // Handle case where active period extends to the end
      if (activeStart !== -1) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
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
    
    if (startMarker === null) {
      setStartMarker(closestIndex);
    } else if (endMarker === null) {
      setEndMarker(closestIndex);
      setIsMarkingMode(false);
    }
  };

  // Update zoom range when chart is zoomed or panned
  const updateZoomRange = (chart: any) => {
    const xScale = chart.scales?.x;
    if (xScale) {
      const minTime = xScale.min;
      const maxTime = xScale.max;
      
      // Check if we're actually zoomed (not showing full range)
      const fullMinTime = chartLabels[0]?.getTime();
      const fullMaxTime = chartLabels[chartLabels.length - 1]?.getTime();
      
      if (minTime > fullMinTime || maxTime < fullMaxTime) {
        // We are zoomed
        // Use setTimeout to prevent immediate re-render that would reset zoom
        zoomRangeRef.current = { min: minTime, max: maxTime };
      } else {
        // We are showing full range
        zoomRangeRef.current = null;
      }
      
      // Update energy totals directly in DOM without React re-render
      updateEnergyTotalsInDOM();
    }
  };

  // Handle zoom change to update visible data statistics

  // Calculate statistics for visible data range
  const getVisibleDataStats = () => {
    if (!zoomRangeRef.current) {
      // Return full dataset stats
      const totalGasEnergy = gasEnergy[gasEnergy.length - 1] || 0;
      const totalPoints = sampledData.length;
      const activePoints = gasActivity.filter(status => status === 1).length;
      const gasActivePercent = totalPoints > 0 ? (activePoints / totalPoints * 100).toFixed(1) : '0';
      return { totalGasEnergy, activePoints, totalPoints, gasActivePercent };
    }

    // Filter data for visible range
    const visibleIndices: number[] = [];
    chartLabels.forEach((label, index) => {
      const time = label.getTime();
      if (time >= zoomRangeRef.current.min && time <= zoomRangeRef.current.max) {
        visibleIndices.push(index);
      }
    });

    // Calculate energy for visible range - get cumulative energy difference
    let visibleGasEnergy = 0;
    if (visibleIndices.length > 0) {
      const startIndex = visibleIndices[0];
      const endIndex = visibleIndices[visibleIndices.length - 1];
      const startEnergy = startIndex > 0 ? gasEnergy[startIndex - 1] : 0;
      const endEnergy = gasEnergy[endIndex];
      visibleGasEnergy = endEnergy - startEnergy;
    }

    const visibleActivePoints = visibleIndices.filter(index => gasActivity[index] === 1).length;
    const visibleTotalPoints = visibleIndices.length;
    const visibleGasActivePercent = visibleTotalPoints > 0 ? (visibleActivePoints / visibleTotalPoints * 100).toFixed(1) : '0';

    return { 
      totalGasEnergy: visibleGasEnergy,
      activePoints: visibleActivePoints, 
      totalPoints: visibleTotalPoints, 
      gasActivePercent: visibleGasActivePercent 
    };
  };

  // Function to update energy totals directly in DOM
  const updateEnergyTotalsInDOM = () => {
    const visibleStats = getVisibleDataStats();
    
    // Find and update the energy total in the subtitle
    const subtitleElement = document.querySelector('[data-gas-energy-total]');
    if (subtitleElement) {
      const isZoomed = zoomRangeRef.current !== null;
      const zoomedText = isZoomed ? ' | (Zoomed View)' : '';
      subtitleElement.innerHTML = `${t('chart.gasPowerCalculationNote')} | <span class="font-semibold text-red-700">${t('chart.totalGasEnergy')}: ${visibleStats.totalGasEnergy.toFixed(2)} kWh</span>${zoomedText}`;
    }
    
    // Update the energy value in the legend box
    const legendEnergyElement = document.querySelector('[data-gas-legend-energy]');
    if (legendEnergyElement) {
      legendEnergyElement.textContent = `${visibleStats.totalGasEnergy.toFixed(2)} kWh`;
    }
    
    // Update the detailed stats
    const detailedStatsElement = document.querySelector('[data-gas-detailed-stats]');
    if (detailedStatsElement) {
      detailedStatsElement.innerHTML = `<span class="font-semibold text-red-700">${t('chart.gasActive')}: ${visibleStats.gasActivePercent}%</span><span class="text-gray-500 ml-2">(${visibleStats.activePoints}/${visibleStats.totalPoints} ${t('chart.dataPoints')})</span><span class="font-semibold text-red-700 ml-4">${t('chart.totalGasEnergy')}: ${visibleStats.totalGasEnergy.toFixed(2)} kWh</span>`;
    }
  };

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('chart.gasPower'),
        data: gasPower,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: t('chart.boilerModulation'),
        data: boilerModulation,
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y1',
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
        text: t('chart.gasPowerAnalysis'),
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
            const isActive = gasActivity[index] === 1;
            return isActive ? '🔥 Gas: Active' : '⭕ Gas: Inactive';
          },
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
          onZoomComplete: ({ chart }: any) => {
            updateZoomRange(chart);
          },
        },
        pan: {
          enabled: !isMarkingMode,
          mode: 'x',
          onPanComplete: ({ chart }: any) => {
            updateZoomRange(chart);
          },
        },
        limits: {
          x: { min: 'original', max: 'original' },
        },
        maintainAspectRatio: false,
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
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        title: {
          display: true,
          text: t('chart.gasPowerAxis'),
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: t('chart.boilerModulationAxis'),
        },
      },
    },
  };

  const resetZoom = () => {
    const chartInstance = ChartJS.getChart('gas-power-chart');
    if (chartInstance) {
      chartInstance.resetZoom();
      zoomRangeRef.current = null;
      updateEnergyTotalsInDOM();
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
    const markedGasPower = gasPower.slice(start, end + 1);
    const markedActivity = gasActivity.slice(start, end + 1);
    
    const totalEnergy = markedGasPower.reduce((sum, power) => sum + (power / 60), 0); // kWh
    const activePoints = markedActivity.filter(status => status === 1).length;
    const totalPoints = markedData.length;
    const activePercent = totalPoints > 0 ? (activePoints / totalPoints * 100).toFixed(1) : '0';
    
    return {
      startTime: `${markedData[0].date} ${markedData[0].time}`,
      endTime: `${markedData[markedData.length - 1].date} ${markedData[markedData.length - 1].time}`,
      totalEnergy: totalEnergy.toFixed(2),
      activePercent,
      duration: `${Math.round((end - start) * 5)} minutes`, // Assuming 5-minute intervals
    };
  };

  const markedStats = getMarkedPeriodStats();
  
  // Calculate gas energy statistics for visible range
  const visibleStats = getVisibleDataStats();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t('chart.gasPowerAnalysis')}</h3>
          <p className="text-sm text-gray-600" data-gas-energy-total>
            {t('chart.gasPowerCalculationNote')} | <span className="font-semibold text-red-700">{t('chart.totalGasEnergy')}: {visibleStats.totalGasEnergy.toFixed(2)} kWh</span>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
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
              <span className="text-blue-600 font-medium">{t('chart.gasEnergy')}:</span>
              <p className="text-blue-800 font-semibold">{markedStats.totalEnergy} kWh</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.gasActive')}:</span>
              <p className="text-blue-800">{markedStats.activePercent}%</p>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ height: '400px' }}>
        <Line 
          id="gas-power-chart" 
          data={chartData} 
          options={options}
          plugins={[gasBackgroundPlugin, markersPlugin]}
        />
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium">{t('chart.gasActiveBackground')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.gasActiveBackgroundDesc')}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="font-medium">{t('chart.gasPowerLegend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.gasPowerDesc')}</p>
          <p className="font-semibold text-red-700" data-gas-legend-energy>{visibleStats.totalGasEnergy.toFixed(2)} kWh</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span className="font-medium">{t('chart.boilerModulationLegend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.boilerModulationDesc')}</p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <div className="mb-2" data-gas-detailed-stats>
          <span className="font-semibold text-red-700">{t('chart.gasActive')}: {visibleStats.gasActivePercent}%</span>
          <span className="text-gray-500 ml-2">({visibleStats.activePoints}/{visibleStats.totalPoints} {t('chart.dataPoints')})</span>
          <span className="font-semibold text-red-700 ml-4">{t('chart.totalGasEnergy')}: {visibleStats.totalGasEnergy.toFixed(2)} kWh</span>
        </div>
        <p><strong>{t('chart.note')}:</strong> {t('chart.gasPowerCalculationNote')}</p>
        <ul className="mt-1 ml-4 list-disc">
          <li>{t('chart.gasPowerFormula')}</li>
          <li>{t('chart.energyValuesCumulative')}</li>
          <li>{t('chart.redBackgroundNote')}</li>
          <li><strong>{t('chart.marking')}:</strong> {t('chart.markingInstructions')}</li>
        </ul>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        {t('chart.zoomMarkingInstructions')}
      </div>
    </div>
  );
};
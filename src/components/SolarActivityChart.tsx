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
  ChartOptions,
  Plugin,
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

/** Plugin that reads inputs from chart options, not from React closures */
const solarBackgroundPlugin: Plugin<'line'> = {
  id: 'solarBackground',
  beforeDraw: (chart) => {
    const { ctx, chartArea, scales, options } = chart;
    if (!chartArea || !scales?.x) return;

    const cfg: any = (options as any)?.plugins?.solarBackground || {};
    const labels: Date[] = cfg.labels || [];
    const activity: number[] = cfg.activity || [];

    if (!labels.length || labels.length !== activity.length) return;

    ctx.save();

    const drawSpan = (x0: number, x1: number) => {
      const left = Math.max(chartArea.left, x0);
      const right = Math.min(chartArea.right, x1);
      if (right > left) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.15)'; // amber-ish, 15%
        ctx.fillRect(left, chartArea.top, right - left, chartArea.height);
      }
    };

    let activeStartX: number | null = null;
    for (let i = 0; i < labels.length; i++) {
      const t = labels[i].getTime();
      const x = scales.x.getPixelForValue(t);
      const isActive = activity[i] === 1;

      if (isActive && activeStartX === null) {
        activeStartX = x;
      } else if (!isActive && activeStartX !== null) {
        drawSpan(activeStartX, x);
        activeStartX = null;
      }
    }
    if (activeStartX !== null) {
      drawSpan(activeStartX, chartArea.right);
    }

    ctx.restore();
  },
};

export const SolarActivityChart: React.FC<SolarActivityChartProps> = ({ data }) => {
  const { t } = useLanguage();

  const [startMarker, setStartMarker] = React.useState<number | null>(null);
  const [endMarker, setEndMarker] = React.useState<number | null>(null);
  const [isMarkingMode, setIsMarkingMode] = React.useState(false);
  const zoomRangeRef = React.useRef<{ min: number; max: number } | null>(null);
  const [, forceUpdate] = React.useState(0);

  // Sample every 5th point for performance
  const sampledData = React.useMemo(
    () => data.filter((_, index) => index % 5 === 0),
    [data]
  );

  // Time labels
  const chartLabels: Date[] = React.useMemo(() => {
    return sampledData.map((d) => {
      const [day, month, year] = d.date.split('.');
      const [hours, minutes] = d.time.split(':');
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
    });
  }, [sampledData]);

  // Solar activity (0/1)
  const solarActivity: number[] = React.useMemo(() => {
    return sampledData.map((d) => {
      const isSolarActive =
        d.solarStatus.includes('Charging') ||
        d.collectorPump === 'On' ||
        d.collectorTemp > d.dhwTempTop + 5;
      return isSolarActive ? 1 : 0;
    });
  }, [sampledData]);

  // Marker drawing plugin (safe to rebuild per render)
  const markersPlugin: Plugin<'line'> = React.useMemo(
    () => ({
      id: 'markers',
      afterDraw: (chart) => {
        const { ctx, chartArea, scales } = chart as any;
        if (!chartArea || !scales?.x) return;

        ctx.save();

        // start marker
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

          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('START', x + 5, chartArea.top + 15);
        }

        // end marker
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

          ctx.fillStyle = '#EF4444';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('END', x + 5, chartArea.top + 30);
        }

        ctx.restore();
      },
    }),
    [startMarker, endMarker, chartLabels]
  );

  // Click-to-mark handler
  const handleChartClick = (event: any, _elements: any, chart: any) => {
    if (!isMarkingMode || chartLabels.length === 0) return;

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
    } else {
      // restart marking if both already set
      setStartMarker(closestIndex);
      setEndMarker(null);
    }
  };

  // Zoom/pan complete handlers (chartjs-plugin-zoom)
  const handleZoomPanComplete = React.useCallback(({ chart }: any) => {
    const xScale = chart.scales?.x;
    if (!xScale) return;

    const minTime = xScale.min;
    const maxTime = xScale.max;

    const currentLabels = chart.data?.labels || [];
    if (currentLabels.length === 0) return;
    
    const fullMin = currentLabels[0]?.getTime ? currentLabels[0].getTime() : currentLabels[0];
    const fullMax = currentLabels[currentLabels.length - 1]?.getTime ? 
      currentLabels[currentLabels.length - 1].getTime() : 
      currentLabels[currentLabels.length - 1];

    // Check if we're at full extent (with small tolerance)
    const tolerance = (fullMax - fullMin) * 0.01; // 1% tolerance
    if (minTime <= fullMin + tolerance && maxTime >= fullMax - tolerance) {
      zoomRangeRef.current = null;
    } else {
      zoomRangeRef.current = { min: minTime, max: maxTime };
    }
    
    forceUpdate(prev => prev + 1);
  }, []);

  // Visible-range stats
  const getVisibleDataStats = React.useCallback(() => {
    if (!zoomRangeRef.current || chartLabels.length === 0) {
      const totalPoints = sampledData.length;
      const activePoints = solarActivity.filter((s) => s === 1).length;
      const solarEfficiencyPercent =
        totalPoints > 0 ? ((activePoints / totalPoints) * 100).toFixed(1) : '0';
      return { activePoints, totalPoints, solarEfficiencyPercent };
    }

    const visibleIndices: number[] = [];
    chartLabels.forEach((label, index) => {
      const time = label.getTime();
      if (time >= zoomRangeRef.current!.min && time <= zoomRangeRef.current!.max) {
        visibleIndices.push(index);
      }
    });

    const visibleActivePoints = visibleIndices.filter((i) => solarActivity[i] === 1).length;
    const visibleTotalPoints = visibleIndices.length;
    const visibleSolarEfficiencyPercent =
      visibleTotalPoints > 0
        ? ((visibleActivePoints / visibleTotalPoints) * 100).toFixed(1)
        : '0';

    return {
      activePoints: visibleActivePoints,
      totalPoints: visibleTotalPoints,
      solarEfficiencyPercent: visibleSolarEfficiencyPercent,
    };
  }, [chartLabels, sampledData.length, solarActivity]);

  const chartData = React.useMemo(
    () => ({
      labels: chartLabels,
      datasets: [
        {
          label: t('chart.collectorTempB6'),
          data: sampledData.map((d) => d.collectorTemp),
          borderColor: '#EAB308',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          borderWidth: 1,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: t('chart.dhwTemp'),
          data: sampledData.map((d) => d.dhwTempTop),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 1,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: t('chart.b31Temp'),
          data: sampledData.map((d) => d.sensorTemp),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 1,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    }),
    [chartLabels, sampledData, t]
  );

  const options: ChartOptions<'line'> = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      onClick: handleChartClick,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            font: { size: 12 },
          },
        },
        title: {
          display: true,
          text: t('chart.solarActivity'),
          font: { size: 16, weight: 'bold' },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          callbacks: {
            afterTitle: (tooltipItems: any) => {
              const index = tooltipItems[0].dataIndex;
              const isActive = solarActivity[index] === 1;
              return isActive ? '🌞 Solar: Active' : '🌙 Solar: Inactive';
            },
            label: (context: any) =>
              `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`,
          },
        },

        /** Feed fresh inputs to the background plugin on every render */
        solarBackground: {
          labels: chartLabels,     // Date[]
          activity: solarActivity, // number[] of 0/1
        },

        zoom: {
          zoom: {
            wheel: { enabled: !isMarkingMode },
            pinch: { enabled: !isMarkingMode },
            mode: 'x',
            onZoomComplete: handleZoomPanComplete,
          },
          pan: {
            enabled: !isMarkingMode,
            mode: 'x',
            onPanComplete: handleZoomPanComplete,
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
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
        },
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          title: {
            display: true,
            text: t('chart.temperatureAxis'),
          },
        },
      },
    }),
    [handleChartClick, isMarkingMode, t, chartLabels, solarActivity, handleZoomPanComplete]
  );

  const resetZoom = () => {
    const chartInstance = ChartJS.getChart('solar-activity-chart');
    if (chartInstance) {
      (chartInstance as any).resetZoom();
      zoomRangeRef.current = null;
      forceUpdate(prev => prev + 1);
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

  // Marked period stats
  const markedStats = React.useMemo(() => {
    if (startMarker === null || endMarker === null) return null;

    const start = Math.min(startMarker, endMarker);
    const end = Math.max(startMarker, endMarker);
    const markedData = sampledData.slice(start, end + 1);
    const markedActivity = solarActivity.slice(start, end + 1);

    const activePoints = markedActivity.filter((s) => s === 1).length;
    const totalPoints = markedData.length;
    const activePercent =
      totalPoints > 0 ? ((activePoints / totalPoints) * 100).toFixed(1) : '0';

    const avgCollectorTemp =
      markedData.reduce((sum, d) => sum + d.collectorTemp, 0) / Math.max(1, markedData.length);
    const avgDhwTemp =
      markedData.reduce((sum, d) => sum + d.dhwTempTop, 0) / Math.max(1, markedData.length);
    const avgSensorTemp =
      markedData.reduce((sum, d) => sum + d.sensorTemp, 0) / Math.max(1, markedData.length);

    return {
      startTime: `${markedData[0].date} ${markedData[0].time}`,
      endTime: `${markedData[markedData.length - 1].date} ${markedData[markedData.length - 1].time}`,
      activePercent,
      duration: `${Math.round((end - start) * 5)} minutes`, // 5-min sampling
      avgCollectorTemp: avgCollectorTemp.toFixed(1),
      avgDhwTemp: avgDhwTemp.toFixed(1),
      avgSensorTemp: avgSensorTemp.toFixed(1),
    };
  }, [startMarker, endMarker, sampledData, solarActivity]);

  const visibleStats = getVisibleDataStats();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t('chart.solarActivity')}</h3>
          <p className="text-sm text-gray-600">
            {t('chart.solarActivePercent')}: {visibleStats.solarEfficiencyPercent}% ({visibleStats.activePoints}/{visibleStats.totalPoints} {t('chart.dataPoints')})
            {zoomRangeRef.current && <span className="ml-2 text-blue-600 font-medium">(Zoomed View)</span>}
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

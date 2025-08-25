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

interface GasPowerChartProps {
  data: HeatingDataPoint[];
}

/** Background plugin: reads labels/activity from options (no stale closures). */
const gasBackgroundPlugin: Plugin<'line'> = {
  id: 'gasBackground',
  beforeDraw: (chart) => {
    const { ctx, chartArea, scales, options } = chart;
    if (!chartArea || !scales?.x) return;

    const cfg: any = (options as any)?.plugins?.gasBackground || {};
    const labels: Date[] = cfg.labels || [];
    const activity: number[] = cfg.activity || [];

    if (!labels.length || labels.length !== activity.length) return;

    ctx.save();

    let startX: number | null = null;

    const drawRect = (x0: number, x1: number) => {
      const left = Math.max(chartArea.left, x0);
      const right = Math.min(chartArea.right, x1);
      if (right > left) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // red @ 20%
        ctx.fillRect(left, chartArea.top, right - left, chartArea.height);
      }
    };

    for (let i = 0; i < labels.length; i++) {
      const t = labels[i].getTime();
      const x = scales.x.getPixelForValue(t);
      const isActive = activity[i] === 1;

      if (isActive && startX === null) {
        startX = x;
      } else if (!isActive && startX !== null) {
        drawRect(startX, x);
        startX = null;
      }
    }
    if (startX !== null) drawRect(startX, chartArea.right);

    ctx.restore();
  },
};

export const GasPowerChart: React.FC<GasPowerChartProps> = ({ data }) => {
  const { t } = useLanguage();

  const [startMarker, setStartMarker] = React.useState<number | null>(null);
  const [endMarker, setEndMarker] = React.useState<number | null>(null);
  const [isMarkingMode, setIsMarkingMode] = React.useState(false);
  const zoomRangeRef = React.useRef<{ min: number; max: number } | null>(null);

  // Use all data - no sampling
  const sampledData = React.useMemo(() => data, [data]);

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

  // Gas activity (0/1)
  const gasActivity: number[] = React.useMemo(
    () => sampledData.map((d) => (d.dhwPump === 'On' ? 1 : 0)),
    [sampledData]
  );

  // Gas power (kW): 10 kW * modulation% when active
  const gasPower: number[] = React.useMemo(() => {
    return sampledData.map((d, i) => {
      // Only calculate power when gas system is active (DHW pump on)
      if (gasActivity[i] !== 1) return 0;
      if (!d.boilerModulation || d.boilerModulation === '----') return 0;
      const m = parseFloat(d.boilerModulation.replace('%', '').trim());
      const modulation = isNaN(m) ? 0 : m;
      // Only return power if modulation is greater than 0
      if (modulation <= 0) return 0;
      return 10 * (modulation / 100);
    });
  }, [sampledData, gasActivity]);

  // Cumulative gas energy (kWh) - only accumulate when system is active and producing
  const gasEnergy: number[] = React.useMemo(() => {
    const arr: number[] = [];
    let cum = 0;
    const dt = 1 / 60; // 1-minute intervals
    for (let i = 0; i < gasPower.length; i++) {
      // Only add energy when the system is actually consuming gas (power > 0)
      if (gasPower[i] > 0) {
        cum += gasPower[i] * dt;
      }
      arr.push(cum);
    }
    return arr;
  }, [gasPower]);

  // Boiler modulation series for display
  const boilerModulation: number[] = React.useMemo(() => {
    return sampledData.map((d) => {
      if (!d.boilerModulation || d.boilerModulation === '----') return 0;
      const m = parseFloat(d.boilerModulation.replace('%', '').trim());
      return isNaN(m) ? 0 : m;
    });
  }, [sampledData]);

  // Markers plugin
  const markersPlugin: Plugin<'line'> = React.useMemo(
    () => ({
      id: 'markers',
      afterDraw: (chart) => {
        const { ctx, chartArea, scales } = chart as any;
        if (!chartArea || !scales?.x) return;

        ctx.save();

        if (startMarker !== null && startMarker < chartLabels.length) {
          const x = scales.x.getPixelForValue(chartLabels[startMarker].getTime());
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

        if (endMarker !== null && endMarker < chartLabels.length) {
          const x = scales.x.getPixelForValue(chartLabels[endMarker].getTime());
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

  // Click to set markers (now really finds the nearest point)
  const handleChartClick = (event: any, _elements: any, chart: any) => {
    if (!isMarkingMode || chartLabels.length === 0) return;

    const canvasPos = getRelativePosition(event, chart);
    const dataX = chart.scales.x.getValueForPixel(canvasPos.x);

    let closestIndex = 0;
    let minDist = Math.abs(chartLabels[0].getTime() - dataX);
    for (let i = 1; i < chartLabels.length; i++) {
      const d = Math.abs(chartLabels[i].getTime() - dataX);
      if (d < minDist) {
        minDist = d;
        closestIndex = i;
      }
    }

    if (startMarker === null) {
      setStartMarker(closestIndex);
    } else if (endMarker === null) {
      setEndMarker(closestIndex);
      setIsMarkingMode(false);
    } else {
      // restart selection
      setStartMarker(closestIndex);
      setEndMarker(null);
    }
  };

  // Update zoom range + DOM stats
  const updateZoomRange = React.useCallback((chart: any) => {
    const xScale = chart.scales?.x;
    if (!xScale) return;

    const minTime = xScale.min;
    const maxTime = xScale.max;

    const fullMin = chartLabels[0]?.getTime();
    const fullMax = chartLabels[chartLabels.length - 1]?.getTime();

    if (fullMin == null || fullMax == null) {
      zoomRangeRef.current = { min: minTime, max: maxTime };
    } else if (minTime > fullMin || maxTime < fullMax) {
      zoomRangeRef.current = { min: minTime, max: maxTime };
    } else {
      zoomRangeRef.current = null;
    }

    updateEnergyTotalsInDOM();
  }, [chartLabels]);

  // Visible-range stats
  const getVisibleDataStats = React.useCallback(() => {
    if (!zoomRangeRef.current || chartLabels.length === 0) {
      const totalGasEnergy = gasEnergy[gasEnergy.length - 1] || 0;
      const totalPoints = sampledData.length;
      const activePoints = gasActivity.filter((s) => s === 1).length;
      const gasActivePercent =
        totalPoints > 0 ? ((activePoints / totalPoints) * 100).toFixed(1) : '0';
      return { totalGasEnergy, activePoints, totalPoints, gasActivePercent };
    }

    const visibleIdx: number[] = [];
    chartLabels.forEach((label, index) => {
      const t = label.getTime();
      if (
        t >= (zoomRangeRef.current as any).min &&
        t <= (zoomRangeRef.current as any).max
      ) {
        visibleIdx.push(index);
      }
    });

    let visibleGasEnergy = 0;
    if (visibleIdx.length > 0) {
      const s = visibleIdx[0];
      const e = visibleIdx[visibleIdx.length - 1];
      const sEnergy = s > 0 ? gasEnergy[s - 1] : 0;
      const eEnergy = gasEnergy[e];
      visibleGasEnergy = eEnergy - sEnergy;
    }

    const visibleActive = visibleIdx.filter((i) => gasActivity[i] === 1).length;
    const visibleTotal = visibleIdx.length;
    const visiblePct =
      visibleTotal > 0 ? ((visibleActive / visibleTotal) * 100).toFixed(1) : '0';

    return {
      totalGasEnergy: visibleGasEnergy,
      activePoints: visibleActive,
      totalPoints: visibleTotal,
      gasActivePercent: visiblePct,
    };
  }, [chartLabels, gasEnergy, gasActivity, sampledData.length]);

  // DOM updater for totals (no React re-render)
  const updateEnergyTotalsInDOM = React.useCallback(() => {
    const stats = getVisibleDataStats();

    const subtitle = document.querySelector('[data-gas-energy-total]');
    if (subtitle) {
      const isZoomed = zoomRangeRef.current !== null;
      const zoomedText = isZoomed ? ' | (Zoomed View)' : '';
      subtitle.innerHTML = `${t('chart.gasPowerCalculationNote')} | <span class="font-semibold text-red-700">${t(
        'chart.totalGasEnergy'
      )}: ${stats.totalGasEnergy.toFixed(2)} kWh</span>${zoomedText}`;
    }

    const legend = document.querySelector('[data-gas-legend-energy]');
    if (legend) {
      (legend as HTMLElement).textContent = `${stats.totalGasEnergy.toFixed(2)} kWh`;
    }

    const details = document.querySelector('[data-gas-detailed-stats]');
    if (details) {
      details.innerHTML = `<span class="font-semibold text-red-700">${t(
        'chart.gasActive'
      )}: ${stats.gasActivePercent}%</span><span class="text-gray-500 ml-2">(${
        stats.activePoints
      }/${stats.totalPoints} ${t('chart.dataPoints')})</span><span class="font-semibold text-red-700 ml-4">${t(
        'chart.totalGasEnergy'
      )}: ${stats.totalGasEnergy.toFixed(2)} kWh</span>`;
    }
  }, [getVisibleDataStats, t]);

  // Keep DOM stats in sync on mount/data changes
  React.useEffect(() => {
    updateEnergyTotalsInDOM();
  }, [data, chartLabels, gasEnergy, gasActivity, updateEnergyTotalsInDOM]);

  const chartData = React.useMemo(
    () => ({
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
    }),
    [chartLabels, gasPower, boilerModulation, t]
  );

  const options: ChartOptions<'line'> = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      onClick: handleChartClick,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, font: { size: 12 } },
        },
        title: {
          display: true,
          text: t('chart.gasPowerAnalysis'),
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
            afterTitle: (items: any) => {
              const i = items[0].dataIndex;
              return gasActivity[i] === 1 ? '🔥 Gas: Active' : '⭕ Gas: Inactive';
            },
          },
        },

        /** Feed fresh inputs to the background plugin every render */
        gasBackground: {
          labels: chartLabels,  // Date[]
          activity: gasActivity // number[] 0/1
        },

        zoom: {
          zoom: {
            wheel: { enabled: !isMarkingMode },
            pinch: { enabled: !isMarkingMode },
            mode: 'x',
            onZoomComplete: ({ chart }: any) => updateZoomRange(chart),
          },
          pan: {
            enabled: !isMarkingMode,
            mode: 'x',
            onPanComplete: ({ chart }: any) => updateZoomRange(chart),
          },
          limits: { x: { min: 'original', max: 'original' } },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { displayFormats: { hour: 'HH:mm', day: 'MMM dd' } },
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          title: { display: true, text: t('chart.gasPowerAxis') },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: t('chart.boilerModulationAxis') },
        },
      },
    }),
    [handleChartClick, isMarkingMode, t, chartLabels, gasActivity, updateZoomRange]
  );

  const resetZoom = () => {
    const chartInstance = ChartJS.getChart('gas-power-chart');
    if (chartInstance) {
      (chartInstance as any).resetZoom();
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

  // Marked period stats
  const markedStats = React.useMemo(() => {
    if (startMarker === null || endMarker === null) return null;

    const start = Math.min(startMarker, endMarker);
    const end = Math.max(startMarker, endMarker);
    const markedData = sampledData.slice(start, end + 1);
    const markedGasPower = gasPower.slice(start, end + 1);
    const markedActivity = gasActivity.slice(start, end + 1);

    const totalEnergy = markedGasPower.reduce((sum, p) => sum + p / 60, 0); // kWh
    const activePoints = markedActivity.filter((s) => s === 1).length;
    const totalPoints = markedData.length;
    const activePercent =
      totalPoints > 0 ? ((activePoints / totalPoints) * 100).toFixed(1) : '0';

    return {
      startTime: `${markedData[0].date} ${markedData[0].time}`,
      endTime: `${markedData[markedData.length - 1].date} ${markedData[markedData.length - 1].time}`,
      totalEnergy: totalEnergy.toFixed(2),
      activePercent,
      duration: `${Math.round((end - start) * 5)} minutes`, // 5-min sampling
    };
  }, [startMarker, endMarker, sampledData, gasPower, gasActivity]);

  const visibleStats = getVisibleDataStats();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t('chart.gasPowerAnalysis')}</h3>
          <p className="text-sm text-gray-600" data-gas-energy-total>
            {t('chart.gasPowerCalculationNote')} |{' '}
            <span className="font-semibold text-red-700">
              {t('chart.totalGasEnergy')}: {visibleStats.totalGasEnergy.toFixed(2)} kWh
            </span>
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
            📍 {t('chart.markingModeActive')}:{' '}
            {startMarker === null ? t('chart.startMarker') : t('chart.endMarker')}
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
          <p className="font-semibold text-red-700" data-gas-legend-energy>
            {visibleStats.totalGasEnergy.toFixed(2)} kWh
          </p>
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
          <span className="font-semibold text-red-700">
            {t('chart.gasActive')}: {visibleStats.gasActivePercent}%
          </span>
          <span className="text-gray-500 ml-2">
            ({visibleStats.activePoints}/{visibleStats.totalPoints} {t('chart.dataPoints')})
          </span>
          <span className="font-semibold text-red-700 ml-4">
            {t('chart.totalGasEnergy')}: {visibleStats.totalGasEnergy.toFixed(2)} kWh
          </span>
        </div>
        <p>
          <strong>{t('chart.note')}:</strong> {t('chart.gasPowerCalculationNote')}
        </p>
        <ul className="mt-1 ml-4 list-disc">
          <li>{t('chart.gasPowerFormula')}</li>
          <li>{t('chart.energyValuesCumulative')}</li>
          <li>{t('chart.redBackgroundNote')}</li>
          <li>
            <strong>{t('chart.marking')}:</strong> {t('chart.markingInstructions')}
          </li>
        </ul>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {t('chart.zoomMarkingInstructions')}
      </div>
    </div>
  );
};

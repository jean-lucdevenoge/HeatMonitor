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

interface CombinedPowerChartProps {
  data: HeatingDataPoint[];
}

/** Background plugin that reads inputs from chart options (no stale closures) */
const activityBackgroundPlugin: Plugin<'line'> = {
  id: 'activityBackground',
  beforeDraw: (chart) => {
    const { ctx, chartArea, scales, options } = chart;
    if (!chartArea || !scales?.x) return;

    const cfg: any = (options as any)?.plugins?.activityBackground || {};
    const labels: Date[] = cfg.labels || [];
    const solarActivity: number[] = cfg.solarActivity || [];
    const gasActivity: number[] = cfg.gasActivity || [];

    if (!labels.length) return;

    ctx.save();

    const drawSpans = (activityArr: number[], fill: string) => {
      let startX: number | null = null;

      const drawRect = (x0: number, x1: number) => {
        const left = Math.max(chartArea.left, x0);
        const right = Math.min(chartArea.right, x1);
        if (right > left) {
          ctx.fillStyle = fill;
          ctx.fillRect(left, chartArea.top, right - left, chartArea.height);
        }
      };

      for (let i = 0; i < labels.length; i++) {
        const t = labels[i].getTime();
        const x = scales.x.getPixelForValue(t);
        const active = activityArr[i] === 1;

        if (active && startX === null) {
          startX = x;
        } else if (!active && startX !== null) {
          drawRect(startX, x);
          startX = null;
        }
      }
      if (startX !== null) {
        drawRect(startX, chartArea.right);
      }
    };

    // Draw solar first (under), then gas (over)
    drawSpans(solarActivity, 'rgba(249, 115, 22, 0.15)'); // amber
    drawSpans(gasActivity, 'rgba(239, 68, 68, 0.15)');    // red

    ctx.restore();
  },
};

export const CombinedPowerChart: React.FC<CombinedPowerChartProps> = ({ data }) => {
  const { t } = useLanguage();

  const [startMarker, setStartMarker] = React.useState<number | null>(null);
  const [endMarker, setEndMarker] = React.useState<number | null>(null);
  const [isMarkingMode, setIsMarkingMode] = React.useState(false);
  const zoomRangeRef = React.useRef<{ min: number; max: number } | null>(null);

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

  // Activity arrays (0/1)
  const solarActivity: number[] = React.useMemo(
    () =>
      sampledData.map((d) =>
        d.solarStatus.includes('Charging') || d.collectorPump === 'On' ? 1 : 0
      ),
    [sampledData]
  );

  const gasActivity: number[] = React.useMemo(
    () => sampledData.map((d) => (d.dhwPump === 'On' ? 1 : 0)),
    [sampledData]
  );

  // Solar power (kW)
  const solarPower: number[] = React.useMemo(() => {
    const flowRate = 5.5; // L/min when active
    return sampledData.map((d, i) => {
      const tempDiff = d.collectorTemp - d.sensorTemp;
      const active = solarActivity[i] === 1;
      if (!active || tempDiff <= 0) return 0;
      return (flowRate * 4.18 * tempDiff) / 60;
    });
  }, [sampledData, solarActivity]);

  // Gas power (kW), simple 10 kW * modulation%
  const gasPower: number[] = React.useMemo(() => {
    return sampledData.map((d, i) => {
      if (gasActivity[i] !== 1) return 0;
      let modulation = 0;
      if (d.boilerModulation && d.boilerModulation !== '----') {
        const m = parseFloat(d.boilerModulation.replace('%', '').trim());
        modulation = isNaN(m) ? 0 : m;
      }
      return 10 * (modulation / 100);
    });
  }, [sampledData, gasActivity]);

  // Cumulative energies (kWh) with 1-minute timesteps
  const { solarEnergy, gasEnergy } = React.useMemo(() => {
    const s: number[] = [];
    const g: number[] = [];
    let cs = 0;
    let cg = 0;
    const dt = 1 / 60;
    for (let i = 0; i < solarPower.length; i++) {
      cs += solarPower[i] * dt;
      cg += gasPower[i] * dt;
      s.push(cs);
      g.push(cg);
    }
    return { solarEnergy: s, gasEnergy: g };
  }, [solarPower, gasPower]);

  // Markers plugin (safe to close over current labels/markers)
  const markersPlugin: Plugin<'line'> = React.useMemo(
    () => ({
      id: 'markers',
      afterDraw: (chart) => {
        const { ctx, chartArea, scales } = chart as any;
        if (!chartArea || !scales?.x) return;

        ctx.save();

        // Start marker
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

        // End marker
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

  // Click to set markers
  const handleChartClick = (event: any, _elements: any, chart: any) => {
    if (!isMarkingMode || chartLabels.length === 0) return;

    const canvasPosition = getRelativePosition(event, chart);
    const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);

    // nearest index
    let closestIndex = 0;
    let minDistance = Math.abs(chartLabels[0].getTime() - dataX);
    for (let i = 1; i < chartLabels.length; i++) {
      const d = Math.abs(chartLabels[i].getTime() - dataX);
      if (d < minDistance) {
        minDistance = d;
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

  // Update zoom range ref + DOM stats
  const updateZoomRange = React.useCallback(
    (chart: any) => {
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
    },
    [chartLabels]
  );

  // Visible-range stats
  const getVisibleDataStats = React.useCallback(() => {
    if (!zoomRangeRef.current || chartLabels.length === 0) {
      const totalSolarEnergy = solarEnergy[solarEnergy.length - 1] || 0;
      const totalGasEnergy = gasEnergy[gasEnergy.length - 1] || 0;
      const totalCombinedEnergy = totalSolarEnergy + totalGasEnergy;
      const totalPoints = sampledData.length;
      const solarActivePoints = solarActivity.filter((s) => s === 1).length;
      const gasActivePoints = gasActivity.filter((s) => s === 1).length;
      const solarActivePercent =
        totalPoints > 0 ? ((solarActivePoints / totalPoints) * 100).toFixed(1) : '0';
      const gasActivePercent =
        totalPoints > 0 ? ((gasActivePoints / totalPoints) * 100).toFixed(1) : '0';

      return {
        totalSolarEnergy,
        totalGasEnergy,
        totalCombinedEnergy,
        solarActivePoints,
        gasActivePoints,
        totalPoints,
        solarActivePercent,
        gasActivePercent,
      };
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

    let visSolar = 0;
    let visGas = 0;
    if (visibleIdx.length > 0) {
      const s = visibleIdx[0];
      const e = visibleIdx[visibleIdx.length - 1];

      const sSolar = s > 0 ? solarEnergy[s - 1] : 0;
      const eSolar = solarEnergy[e];
      visSolar = eSolar - sSolar;

      const sGas = s > 0 ? gasEnergy[s - 1] : 0;
      const eGas = gasEnergy[e];
      visGas = eGas - sGas;
    }

    const visSolarPts = visibleIdx.filter((i) => solarActivity[i] === 1).length;
    const visGasPts = visibleIdx.filter((i) => gasActivity[i] === 1).length;
    const visTotal = visibleIdx.length;
    const visSolarPct = visTotal > 0 ? ((visSolarPts / visTotal) * 100).toFixed(1) : '0';
    const visGasPct = visTotal > 0 ? ((visGasPts / visTotal) * 100).toFixed(1) : '0';

    return {
      totalSolarEnergy: visSolar,
      totalGasEnergy: visGas,
      totalCombinedEnergy: visSolar + visGas,
      solarActivePoints: visSolarPts,
      gasActivePoints: visGasPts,
      totalPoints: visTotal,
      solarActivePercent: visSolarPct,
      gasActivePercent: visGasPct,
    };
  }, [chartLabels, sampledData.length, solarActivity, gasActivity, solarEnergy, gasEnergy]);

  // DOM updater for totals (keeps UI snappy without rerenders)
  const updateEnergyTotalsInDOM = React.useCallback(() => {
    const stats = getVisibleDataStats();

    const subtitle = document.querySelector('[data-combined-energy-total]');
    if (subtitle) {
      const isZoomed = zoomRangeRef.current !== null;
      const zoomedText = isZoomed ? ' | (Zoomed View)' : '';
      subtitle.innerHTML = `${t('chart.combinedPowerNote')} | <span class="font-semibold text-blue-700">${t(
        'chart.totalCombinedEnergy'
      )}: ${stats.totalCombinedEnergy.toFixed(2)} kWh</span>${zoomedText}`;
    }

    const solarLegend = document.querySelector('[data-combined-solar-legend-energy]');
    if (solarLegend) {
      solarLegend.textContent = `${stats.totalSolarEnergy.toFixed(2)} kWh`;
    }

    const gasLegend = document.querySelector('[data-combined-gas-legend-energy]');
    if (gasLegend) {
      gasLegend.textContent = `${stats.totalGasEnergy.toFixed(2)} kWh`;
    }

    const details = document.querySelector('[data-combined-detailed-stats]');
    if (details) {
      details.innerHTML = `
        <span class="font-semibold text-amber-700">${t('chart.solarActive')}: ${stats.solarActivePercent}%</span>
        <span class="font-semibold text-red-700 ml-4">${t('chart.gasActive')}: ${stats.gasActivePercent}%</span>
        <span class="font-semibold text-amber-700 ml-4">${t('chart.totalSolarEnergy')}: ${stats.totalSolarEnergy.toFixed(2)} kWh</span>
        <span class="font-semibold text-red-700 ml-4">${t('chart.totalGasEnergy')}: ${stats.totalGasEnergy.toFixed(2)} kWh</span>
      `;
    }
  }, [getVisibleDataStats, t]);

  // Keep DOM stats in sync on mount/data change
  React.useEffect(() => {
    updateEnergyTotalsInDOM();
  }, [data, chartLabels, solarEnergy, gasEnergy, updateEnergyTotalsInDOM]);

  const chartData = React.useMemo(
    () => ({
      labels: chartLabels,
      datasets: [
        {
          label: t('chart.solarPower'),
          data: solarPower,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 1,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: t('chart.gasPower'),
          data: gasPower,
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 1,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    }),
    [chartLabels, solarPower, gasPower, t]
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
          text: t('chart.combinedPowerAnalysis'),
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
              const s = solarActivity[i] === 1;
              const g = gasActivity[i] === 1;
              if (s && g) return '🌞🔥 Solar + Gas: Active';
              if (s) return '🌞 Solar: Active';
              if (g) return '🔥 Gas: Active';
              return '⭕ Both: Inactive';
            },
          },
        },

        /** Feed fresh inputs to the background plugin every render */
        activityBackground: {
          labels: chartLabels,     // Date[]
          solarActivity,           // number[] 0/1
          gasActivity,             // number[] 0/1
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
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          title: { display: true, text: t('chart.powerAxis') },
        },
      },
    }),
    [handleChartClick, isMarkingMode, t, chartLabels, solarActivity, gasActivity, updateZoomRange]
  );

  const resetZoom = () => {
    const chartInstance = ChartJS.getChart('combined-power-chart');
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
    const markedSolarPower = solarPower.slice(start, end + 1);
    const markedGasPower = gasPower.slice(start, end + 1);
    const markedSolarActivity = solarActivity.slice(start, end + 1);
    const markedGasActivity = gasActivity.slice(start, end + 1);

    const totalSolarEnergy = markedSolarPower.reduce((sum, p) => sum + p / 60, 0);
    const totalGasEnergy = markedGasPower.reduce((sum, p) => sum + p / 60, 0);
    const solarActivePoints = markedSolarActivity.filter((s) => s === 1).length;
    const gasActivePoints = markedGasActivity.filter((s) => s === 1).length;
    const totalPoints = markedData.length;
    const solarActivePercent =
      totalPoints > 0 ? ((solarActivePoints / totalPoints) * 100).toFixed(1) : '0';
    const gasActivePercent =
      totalPoints > 0 ? ((gasActivePoints / totalPoints) * 100).toFixed(1) : '0';

    return {
      startTime: `${markedData[0].date} ${markedData[0].time}`,
      endTime: `${markedData[markedData.length - 1].date} ${markedData[markedData.length - 1].time}`,
      totalSolarEnergy: totalSolarEnergy.toFixed(2),
      totalGasEnergy: totalGasEnergy.toFixed(2),
      solarActivePercent,
      gasActivePercent,
      duration: `${Math.round((end - start) * 5)} minutes`, // 5-min sampling
    };
  }, [startMarker, endMarker, sampledData, solarPower, gasPower, solarActivity, gasActivity]);

  const visibleStats = getVisibleDataStats();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t('chart.combinedPowerAnalysis')}</h3>
          <p className="text-sm text-gray-600" data-combined-energy-total>
            {t('chart.combinedPowerNote')} |{' '}
            <span className="font-semibold text-blue-700">
              {t('chart.totalCombinedEnergy')}: {visibleStats.totalCombinedEnergy.toFixed(2)} kWh
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
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
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-blue-600 font-medium">{t('chart.solarEnergy')}:</span>
              <p className="text-blue-800 font-semibold">{markedStats.totalSolarEnergy} kWh</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.gasEnergy')}:</span>
              <p className="text-blue-800 font-semibold">{markedStats.totalGasEnergy} kWh</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.solarActive')}:</span>
              <p className="text-blue-800">{markedStats.solarActivePercent}%</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.gasActive')}:</span>
              <p className="text-blue-800">{markedStats.gasActivePercent}%</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '400px' }}>
        <Line
          id="combined-power-chart"
          data={chartData}
          options={options}
          plugins={[activityBackgroundPlugin, markersPlugin]}
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
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium">{t('chart.gasActiveBackground')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.gasActiveBackgroundDesc')}</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="font-medium">{t('chart.solarPowerLegend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.solarPowerDesc')}</p>
          <p cla

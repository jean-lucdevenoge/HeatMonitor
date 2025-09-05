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

interface EnergyChartProps {
  data: HeatingDataPoint[];
}

/** ---- FIX: background plugin reads inputs from options, not React closures ---- */
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

    // keep background below everything
    let activeStartX: number | null = null;

    const drawSpan = (x0: number, x1: number) => {
      const left = Math.max(chartArea.left, x0);
      const right = Math.min(chartArea.right, x1);
      if (right > left) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.20)'; // amber-500 @ 0.2
        ctx.fillRect(left, chartArea.top, right - left, chartArea.height);
      }
    };

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

export const EnergyChart: React.FC<EnergyChartProps> = ({ data }) => {
  const { t } = useLanguage();

  const zoomRangeRef = React.useRef<{ min: number; max: number } | null>(null);

  const [startMarker, setStartMarker] = React.useState<number | null>(null);
  const [endMarker, setEndMarker] = React.useState<number | null>(null);
  const [isMarkingMode, setIsMarkingMode] = React.useState(false);

  // simple force re-render helper
  const [, setTick] = React.useState(0);
  const forceUpdate = React.useCallback(() => setTick((v) => v + 1), []);

  // Use all data - no sampling
  const sampledData = React.useMemo(() => data, [data]);

  // Convert date/time to proper Date objects
  const chartLabels: Date[] = React.useMemo(() => {
    return sampledData.map((d) => {
      const [year, month, day] = d.date.split('-'); // Now YYYY-MM-DD format
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

  // Calculate temperature differences and solar power/activity
  const tempDifferences = React.useMemo(
    () => sampledData.map((d) => d.collectorTemp - d.sensorTemp), // B6 - B31
    [sampledData]
  );

  const solarActivity: number[] = React.useMemo(
    () =>
      sampledData.map((d) =>
        d.solarStatus.includes('Charging') || d.collectorPump === 'On' ? 1 : 0
      ),
    [sampledData]
  );

  const solarPower: number[] = React.useMemo(() => {
    const flowRate = 5.5; // L/min when active
    return sampledData.map((d, index) => {
      const tempDiff = d.collectorTemp - d.sensorTemp;
      const isSolarActive = solarActivity[index] === 1;
      // Only calculate power when solar system is active AND there's a positive temperature difference
      if (!isSolarActive || tempDiff <= 0) return 0;
      // Power (kW) ≈ flow_rate (L/min) × specific_heat (4.18 kJ/kg·K) × temp_diff (K) / 60
      return (flowRate * 4.18 * tempDiff) / 60;
    });
  }, [sampledData, solarActivity]);

  // Cumulative solar energy (kWh) - only accumulate when system is active
  const solarEnergy: number[] = React.useMemo(() => {
    const arr: number[] = [];
    let cumulative = 0;
    const dtHours = 1 / 60; // 1-minute intervals
    for (let i = 0; i < solarPower.length; i++) {
      // Only add energy when the system is actually producing power (active + positive temp diff)
      if (solarPower[i] > 0) {
        cumulative += solarPower[i] * dtHours;
      }
      arr.push(cumulative);
    }
    return arr;
  }, [solarPower]);

  // Calculate statistics for visible data range
  const getVisibleDataStats = React.useCallback(() => {
    if (!zoomRangeRef.current || chartLabels.length === 0) {
      const totalSolarEnergy = solarEnergy[solarEnergy.length - 1] || 0;
      const totalPoints = sampledData.length;
      const activePoints = solarActivity.filter((s) => s === 1).length;
      const solarActivePercent =
        totalPoints > 0 ? ((activePoints / totalPoints) * 100).toFixed(1) : '0';
      return {
        totalSolarEnergy,
        activePoints,
        totalPoints,
        solarActivePercent,
      };
    }

    const visibleIndices: number[] = [];
    chartLabels.forEach((label, index) => {
      const time = label.getTime();
      if (
        time >= (zoomRangeRef.current as any).min &&
        time <= (zoomRangeRef.current as any).max
      ) {
        visibleIndices.push(index);
      }
    });

    let visibleSolarEnergy = 0;
    if (visibleIndices.length > 0) {
      const startIndex = visibleIndices[0];
      const endIndex = visibleIndices[visibleIndices.length - 1];
      const startEnergy = startIndex > 0 ? solarEnergy[startIndex - 1] : 0;
      const endEnergy = solarEnergy[endIndex];
      visibleSolarEnergy = endEnergy - startEnergy;
    }

    const visibleActivePoints = visibleIndices.filter(
      (i) => solarActivity[i] === 1
    ).length;
    const visibleTotalPoints = visibleIndices.length;
    const visibleSolarActivePercent =
      visibleTotalPoints > 0
        ? ((visibleActivePoints / visibleTotalPoints) * 100).toFixed(1)
        : '0';

    return {
      totalSolarEnergy: visibleSolarEnergy,
      activePoints: visibleActivePoints,
      totalPoints: visibleTotalPoints,
      solarActivePercent: visibleSolarActivePercent,
    };
  }, [chartLabels, sampledData.length, solarActivity, solarEnergy]);

  // Function to update energy totals directly in DOM
  const updateEnergyTotalsInDOM = React.useCallback(() => {
    const visibleStats = getVisibleDataStats();

    // subtitle
    const subtitleElement = document.querySelector('[data-energy-total]');
    if (subtitleElement) {
      const isZoomed = zoomRangeRef.current !== null;
      const zoomedText = isZoomed ? ' | (Zoomed View)' : '';
      subtitleElement.innerHTML = `${t('chart.powerCalculationNote')} | <span class="font-semibold text-amber-700">${t(
        'chart.totalSolarEnergy'
      )}: ${visibleStats.totalSolarEnergy.toFixed(2)} kWh</span>${zoomedText}`;
    }

    // legend energy
    const legendEnergyElement = document.querySelector('[data-legend-energy]');
    if (legendEnergyElement) {
      legendEnergyElement.textContent = `${visibleStats.totalSolarEnergy.toFixed(
        2
      )} kWh`;
    }

    // detailed stats
    const detailedStatsElement = document.querySelector('[data-detailed-stats]');
    if (detailedStatsElement) {
      detailedStatsElement.innerHTML = `<span class="font-semibold text-orange-700">${t(
        'chart.solarActive'
      )}: ${visibleStats.solarActivePercent}%</span><span class="text-gray-500 ml-2">(${
        visibleStats.activePoints
      }/${visibleStats.totalPoints} ${t(
        'chart.dataPoints'
      )})</span><span class="font-semibold text-amber-700 ml-4">${t(
        'chart.totalSolarEnergy'
      )}: ${visibleStats.totalSolarEnergy.toFixed(2)} kWh</span>`;
    }
  }, [getVisibleDataStats, t]);

  // Update zoom range when chart is zoomed or panned
  const updateZoomRange = React.useCallback(
    (chart: any) => {
      const xScale = chart.scales?.x;
      if (xScale) {
        const minTime = xScale.min;
        const maxTime = xScale.max;

        const fullMinTime = chartLabels[0]?.getTime();
        const fullMaxTime = chartLabels[chartLabels.length - 1]?.getTime();

        if (minTime > fullMinTime || maxTime < fullMaxTime) {
          zoomRangeRef.current = { min: minTime, max: maxTime };
        } else {
          zoomRangeRef.current = null;
        }
        updateEnergyTotalsInDOM();
      }
    },
    [chartLabels, updateEnergyTotalsInDOM]
  );

  // keep DOM stats in sync on first render & when data changes
  React.useEffect(() => {
    updateEnergyTotalsInDOM();
  }, [data, chartLabels, solarEnergy, solarActivity, updateEnergyTotalsInDOM]);

  // Custom plugin to draw markers (ok to close over state because we pass a new instance each render)
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

  // Handle chart click for marking
  const handleChartClick = (event: any, _elements: any, chart: any) => {
    if (!isMarkingMode || chartLabels.length === 0) return;

    const canvasPosition = getRelativePosition(event, chart);
    const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);

    // Find closest data point
    let closestIndex = 0;
    let minDistance = Math.abs(chartLabels[0].getTime() - dataX);
    for (let i = 1; i < chartLabels.length; i++) {
      const dist = Math.abs(chartLabels[i].getTime() - dataX);
      if (dist < minDistance) {
        minDistance = dist;
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
          yAxisID: 'y',
        },
        {
          label: t('chart.tempDiffB6B31'),
          data: tempDifferences,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 1,
          tension: 0.4,
          pointRadius: 0,
          yAxisID: 'y1',
        },
      ],
    }),
    [chartLabels, solarPower, tempDifferences, t]
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
          text: t('chart.solarPowerAnalysis'),
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
          },
        },

        /** ---- FIX: feed fresh inputs to the background plugin ---- */
        solarBackground: {
          labels: chartLabels,      // Date[]
          activity: solarActivity,  // number[] (0/1)
        },

        zoom: {
          zoom: {
            wheel: { enabled: !isMarkingMode },
            pinch: { enabled: !isMarkingMode },
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
          limits: { x: { min: 'original', max: 'original' } },
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
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          title: { display: true, text: t('chart.solarPowerAxis') },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: t('chart.temperatureDifferenceAxis') },
        },
      },
    }),
    [
      handleChartClick,
      isMarkingMode,
      t,
      chartLabels,
      solarActivity,
      updateZoomRange,
    ]
  );

  const resetZoom = () => {
    const chartInstance = ChartJS.getChart('energy-chart');
    if (chartInstance) {
      (chartInstance as any).resetZoom();
      zoomRangeRef.current = null;
      forceUpdate();
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
  const getMarkedPeriodStats = React.useCallback(() => {
    if (startMarker === null || endMarker === null) return null;

    const start = Math.min(startMarker, endMarker);
    const end = Math.max(startMarker, endMarker);
    const markedData = sampledData.slice(start, end + 1);
    const markedSolarPower = solarPower.slice(start, end + 1);
    const markedActivity = solarActivity.slice(start, end + 1);

    const totalEnergy = markedSolarPower.reduce(
      (sum, power) => sum + power / 60,
      0
    ); // kWh, 1-minute steps

    const activePoints = markedActivity.filter((s) => s === 1).length;
    const totalPoints = markedData.length;
    const activePercent =
      totalPoints > 0 ? ((activePoints / totalPoints) * 100).toFixed(1) : '0';

    return {
      startTime: `${markedData[0].date} ${markedData[0].time}`,
      endTime: `${markedData[markedData.length - 1].date} ${
        markedData[markedData.length - 1].time
      }`,
      totalEnergy: totalEnergy.toFixed(2),
      activePercent,
      duration: `${Math.round((end - start) * 5)} minutes`, // 5-minute sampling steps
    };
  }, [startMarker, endMarker, sampledData, solarPower, solarActivity]);

  const markedStats = getMarkedPeriodStats();
  const visibleStats = getVisibleDataStats();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t('chart.solarPowerAnalysis')}</h3>
          <p className="text-sm text-gray-600" data-energy-total>
            {t('chart.powerCalculationNote')} |{' '}
            <span className="font-semibold text-amber-700">
              {t('chart.totalSolarEnergy')}: {visibleStats.totalSolarEnergy.toFixed(2)} kWh
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
          <h4 className="font-semibold text-blue-800 mb-2">
            {t('chart.markedPeriodAnalysis')}
          </h4>
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
              <span className="text-blue-600 font-medium">{t('chart.solarEnergy')}:</span>
              <p className="text-blue-800 font-semibold">{markedStats.totalEnergy} kWh</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{t('chart.solarActive')}:</span>
              <p className="text-blue-800">{markedStats.activePercent}%</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '400px' }}>
        <Line
          id="energy-chart"
          data={chartData}
          options={options}
          plugins={[solarBackgroundPlugin, markersPlugin]}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="font-medium">{t('chart.solarActiveBackground')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.solarActiveBackgroundDesc')}</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="font-medium">{t('chart.solarPowerLegend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.solarPowerDesc')}</p>
          <p className="font-semibold text-amber-700" data-legend-energy>
            {visibleStats.totalSolarEnergy.toFixed(2)} kWh
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium">{t('chart.temperatureDiffLegend')}</span>
          </div>
          <p className="text-gray-600 mt-1">{t('chart.temperatureDiffDesc')}</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <div className="mb-2" data-detailed-stats>
          <span className="font-semibold text-orange-700">
            {t('chart.solarActive')}: {visibleStats.solarActivePercent}%
          </span>
          <span className="text-gray-500 ml-2">
            ({visibleStats.activePoints}/{visibleStats.totalPoints} {t('chart.dataPoints')})
          </span>
          <span className="font-semibold text-amber-700 ml-4">
            {t('chart.totalSolarEnergy')}: {visibleStats.totalSolarEnergy.toFixed(2)} kWh
          </span>
        </div>
        <p>
          <strong>{t('chart.note')}:</strong> {t('chart.solarPowerCalculationNote')}
        </p>
        <ul className="mt-1 ml-4 list-disc">
          <li>{t('chart.solarPowerFormula')}</li>
          <li>{t('chart.energyValuesCumulative')}</li>
          <li>{t('chart.orangeBackgroundNote')}</li>
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

import React from 'react';
import { Calendar } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { useLanguage } from '../contexts/LanguageContext';

interface EnergyCalculation {
  date: string;
  solar_energy_kwh: number;
  gas_energy_kwh: number;
  total_energy_kwh: number;
}

interface MonthlyEnergyChartProps {
  energyData: EnergyCalculation[];
}

interface MonthlyData {
  month: string;
  solarEnergy: number;
  gasEnergy: number;
  totalEnergy: number;
  daysCount: number;
}

export const MonthlyEnergyChart: React.FC<MonthlyEnergyChartProps> = ({ energyData }) => {
  const { t } = useLanguage();

  const aggregateMonthlyData = (): MonthlyData[] => {
    const monthlyMap = new Map<string, MonthlyData>();

    energyData.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthLabel,
          solarEnergy: 0,
          gasEnergy: 0,
          totalEnergy: 0,
          daysCount: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.solarEnergy += day.solar_energy_kwh;
      monthData.gasEnergy += day.gas_energy_kwh;
      monthData.totalEnergy += day.total_energy_kwh;
      monthData.daysCount += 1;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => {
      const [aYear, aMonth] = a.month.split(' ');
      const [bYear, bMonth] = b.month.split(' ');
      const aDate = new Date(`${aMonth} 1, ${aYear}`);
      const bDate = new Date(`${bMonth} 1, ${bYear}`);
      return aDate.getTime() - bDate.getTime();
    });
  };

  const monthlyData = aggregateMonthlyData();

  const chartData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        label: t('analytics.solarEnergy'),
        data: monthlyData.map(m => m.solarEnergy),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
      {
        label: t('analytics.gasEnergy'),
        data: monthlyData.map(m => m.gasEnergy),
        backgroundColor: '#DC2626',
        borderColor: '#B91C1C',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          footer: function(tooltipItems: any[]) {
            const index = tooltipItems[0].dataIndex;
            const monthInfo = monthlyData[index];
            return `Total: ${monthInfo.totalEnergy.toFixed(2)} kWh\nDays: ${monthInfo.daysCount}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Month',
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Energy (kWh)',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-bold text-gray-900">{t('analytics.monthlyEnergyBreakdown')}</h3>
      </div>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

import React from 'react';
import { Thermometer, Droplets, Flame, Sun, Gauge, Clock } from 'lucide-react';
import { SystemMetrics } from '../types/HeatingData';
import { useLanguage } from '../contexts/LanguageContext';

interface MetricsCardsProps {
  metrics: SystemMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  const { t } = useLanguage();

  const cards = [
    {
      title: t('metrics.avgCollectorTemp'),
      value: `${metrics.avgCollectorTemp.toFixed(1)}°C`,
      icon: Sun,
      color: 'bg-gradient-to-br from-orange-500 to-amber-600',
      textColor: 'text-white',
    },
    {
      title: t('metrics.outsideTemp'),
      value: `${metrics.maxOutsideTemp.toFixed(1)}°C`,
      icon: Thermometer,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      textColor: 'text-white',
    },
    {
      title: t('metrics.maxDhwTemp'),
      value: `${metrics.maxDhwTemp.toFixed(1)}°C`,
      icon: Droplets,
      color: 'bg-gradient-to-br from-red-500 to-pink-600',
      textColor: 'text-white',
    },
    {
      title: t('metrics.waterPressure'),
      value: `${metrics.avgWaterPressure.toFixed(2)} bar`,
      icon: Gauge,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      textColor: 'text-white',
    },
    {
      title: t('metrics.solarActiveHours'),
      value: `${metrics.solarActiveHours.toFixed(1)}h`,
      icon: Clock,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      textColor: 'text-white',
    },
    {
      title: t('metrics.gasActiveHours'),
      value: `${metrics.gasActiveHours.toFixed(1)}h`,
      icon: Flame,
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.color} rounded-xl p-6 shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`${card.textColor} opacity-90 text-sm font-medium`}>
                {card.title}
              </p>
              <p className={`${card.textColor} text-2xl font-bold mt-1`}>
                {card.value}
              </p>
            </div>
            <card.icon className={`${card.textColor} w-8 h-8 opacity-80`} />
          </div>
        </div>
      ))}
    </div>
  );
};
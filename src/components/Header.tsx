import React from 'react';
import { Home, Settings, BarChart3, FileText, Calendar } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  dateRange?: { startDate: string; endDate: string };
}

export const Header: React.FC<HeaderProps> = ({ 
  onSectionChange, 
  activeSection, 
  onDateRangeChange,
  dateRange 
}) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'files', label: t('nav.files'), icon: FileText },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">{t('header.title')}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {/* Date Range Selector - only show on dashboard */}
            {activeSection === 'dashboard' && onDateRangeChange && dateRange && (
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => onDateRangeChange(e.target.value, dateRange.endDate)}
                  className="text-sm border-none bg-transparent focus:outline-none focus:ring-0"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => onDateRangeChange(dateRange.startDate, e.target.value)}
                  className="text-sm border-none bg-transparent focus:outline-none focus:ring-0"
                />
              </div>
            )}
            
            {/* Date Range Selector - only show on dashboard */}
            {activeSection === 'dashboard' && onDateRangeChange && dateRange && (
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => onDateRangeChange(e.target.value, dateRange.endDate)}
                  className="text-sm border-none bg-transparent focus:outline-none focus:ring-0"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => onDateRangeChange(dateRange.startDate, e.target.value)}
                  className="text-sm border-none bg-transparent focus:outline-none focus:ring-0"
                />
              </div>
            )}
            
            <nav className="flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeSection === item.id
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
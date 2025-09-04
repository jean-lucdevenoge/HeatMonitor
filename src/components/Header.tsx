import React from 'react';
import { Home, Settings, BarChart3, FileText } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

interface HeaderProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({ onSectionChange, activeSection }) => {
  const { t } = useLanguage();
  const { isLoadingHeatingData, isLoadingEnergyData } = useData();

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
            
            {/* Loading indicator */}
            {(isLoadingHeatingData || isLoadingEnergyData) && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="hidden sm:inline">Loading...</span>
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

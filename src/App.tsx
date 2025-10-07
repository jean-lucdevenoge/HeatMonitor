import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { HouseHeatingAnalyticsDashboard } from './components/HouseHeatingAnalyticsDashboard';
import { LanguageProvider } from './contexts/LanguageContext';
import { DataProvider } from './contexts/DataContext';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'houseHeating':
        return <HouseHeatingAnalyticsDashboard />;
      case 'files':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">File Management</h2>
              <p className="text-gray-600">Email integration and backup features coming soon</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
              <p className="text-gray-600">System configuration options coming soon</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <LanguageProvider>
      <DataProvider>
        <div className="min-h-screen bg-gray-50">
          <Header onSectionChange={setActiveSection} activeSection={activeSection} />
          {renderContent()}
        </div>
      </DataProvider>
    </LanguageProvider>
  );
}

export default App;

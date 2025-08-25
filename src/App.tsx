import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 3); // Last 3 days
    
    return {
      startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      endDate: endDate.toISOString().split('T')[0]
    };
  });

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard dateRange={dateRange} />;
      case 'analytics':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics</h2>
              <p className="text-gray-600">Advanced analytics features coming soon</p>
            </div>
          </div>
        );
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSectionChange={setActiveSection} 
        activeSection={activeSection}
        onDateRangeChange={handleDateRangeChange}
        dateRange={dateRange}
      />
      {renderContent()}
    </div>
    </LanguageProvider>
  );
}

export default App;
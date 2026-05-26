import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { TranslatorPage } from './pages/TranslatorPage';
import { HealthPage } from './pages/HealthPage';
import { ProfilePage } from './pages/ProfilePage';
import { CameraPage } from './pages/CameraPage';
import { MonitorPage } from './pages/MonitorPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'translator':
        return <TranslatorPage />;
      case 'health':
        return <HealthPage />;
      case 'profile':
        return <ProfilePage />;
      case 'camera':
        return <CameraPage />;
      case 'monitor':
        return <MonitorPage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderPage()}
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}
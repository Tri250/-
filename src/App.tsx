import { useState, useCallback, useMemo } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { TranslatorPage } from './pages/TranslatorPage';
import { HealthPage } from './pages/HealthPage';
import { ProfilePage } from './pages/ProfilePage';
import { ErrorBoundary } from './components/ErrorBoundary';

// Define page types for better type safety
type PageType = 'home' | 'translator' | 'health' | 'profile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  // Memoize the page setter to prevent unnecessary re-renders
  const handlePageChange = useCallback((page: PageType) => {
    setCurrentPage(page);
  }, []);

  // Memoize the page render to prevent unnecessary re-renders
  const renderedPage = useMemo(() => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handlePageChange} />;
      case 'translator':
        return <TranslatorPage />;
      case 'health':
        return <HealthPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onNavigate={handlePageChange} />;
    }
  }, [currentPage, handlePageChange]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        {renderedPage}
        <Navigation currentPage={currentPage} onNavigate={handlePageChange} />
      </div>
    </ErrorBoundary>
  );
}
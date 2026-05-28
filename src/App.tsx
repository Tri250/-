import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import Home from './pages/Home';
import PetsPage from './pages/PetsPage';
import HealthRecordsPage from './pages/HealthRecordsPage';
import AIConsultantPage from './pages/AIConsultantPage';
import { TranslatorPage } from './pages/TranslatorPage';
import { HealthManualPage } from './pages/HealthManualPage';
import { RemindersPage } from './pages/RemindersPage';
import { CameraMonitorPage } from './pages/CameraMonitorPage';
import { ProfilePage } from './pages/ProfilePage';
import { MedicalPage } from './pages/MedicalPage';
import { InsurancePage } from './pages/InsurancePage';
import { TrainingPage } from './pages/TrainingPage';
import { ServicesPage } from './pages/ServicesPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { FAB, PullToRefresh } from './components/DesignSystem';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { useAppStore } from './store/appStore';
import { usePetStore } from './store/bondStore';
import { useState, useEffect, useCallback } from 'react';

function KeyboardShortcuts({ onSearch, onNavigate }: { onSearch: () => void; onNavigate: (page: string) => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
          case 'K':
            e.preventDefault();
            onSearch();
            break;
          case 'n':
          case 'N':
            e.preventDefault();
            onNavigate('health-records');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onNavigate]);

  return null;
}

function QuickActionsLayer() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNavigate = useCallback((page: string) => {
    navigate(`/${page}`);
  }, [navigate]);

  const handleSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  return (
    <>
      <KeyboardShortcuts onSearch={handleSearch} onNavigate={handleNavigate} />
      
      <FAB
        onAction={(type) => {
          handleNavigate('health-records');
        }}
        onAIClick={() => handleNavigate('ai-consultant')}
        onReminderClick={() => handleNavigate('reminders')}
        onPetSwitch={() => handleNavigate('pets')}
        onSearch={handleSearch}
        onPetAdd={() => handleNavigate('pets')}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(page, params) => {
          if (page === 'pets' && params?.petId) {
            navigate(`/pets?id=${params.petId}`);
          } else if (page === 'health-records' && params?.recordId) {
            navigate(`/health-records?id=${params.recordId}`);
          } else if (page === 'reminders' && params?.reminderId) {
            navigate(`/reminders?id=${params.reminderId}`);
          } else {
            navigate(`/${page}`);
          }
        }}
      />
    </>
  );
}

function AppContent() {
  const { isAuthenticated, isOnboardingComplete } = useAppStore();

  if (!isAuthenticated) {
    return <AuthPage onSuccess={() => {}} />;
  }

  if (!isOnboardingComplete) {
    return <OnboardingPage onComplete={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/health-records" element={<HealthRecordsPage />} />
        <Route path="/ai-consultant" element={<AIConsultantPage />} />
        <Route path="/translator" element={<TranslatorPage />} />
        <Route path="/manuals" element={<HealthManualPage onNavigate={() => {}} />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/camera-monitor" element={<CameraMonitorPage onNavigate={() => {}} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/medical" element={<MedicalPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/services" element={<ServicesPage onNavigate={() => {}} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Navigation />
      <QuickActionsLayer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

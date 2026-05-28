
// ============================================
// PawSync Pro - App.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用主入口组件
// ============================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
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
import { useAppStore } from './store/appStore';

function AppContent() {
  const { isAuthenticated, isOnboardingComplete } = useAppStore();

  if (!isAuthenticated) {
    return <AuthPage onSuccess={() => {}} />;
  }

  if (!isOnboardingComplete) {
    return <OnboardingPage onComplete={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Routes>
        <Route path="/" element={<HomePage onNavigate={() => {}} />} />
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

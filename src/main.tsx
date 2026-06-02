import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/animations.css';
import { StabilityProvider } from './components/StabilityProvider';
import { stabilityManager } from './lib/stabilityManager';
import { memoryManager } from './lib/memoryManager';
import { powerManager } from './lib/powerManager';

const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  const startMonitoring = () => {
    memoryManager.startMonitoring(10000);
    
    console.log('[App] Performance monitoring initialized');
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startMonitoring, { timeout: 1000 });
  } else {
    setTimeout(startMonitoring, 100);
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <StabilityProvider>
        <App />
      </StabilityProvider>
    </StrictMode>
  );

  console.log('[App] PawSync Pro initialized');
  console.log('[Stability] Stats:', stabilityManager.getStats());
};

const handleError = (error: Error) => {
  stabilityManager.handleError(error);
};

window.addEventListener('error', (event) => {
  handleError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    powerManager.registerBackgroundCleanup('app-background', () => {
      memoryManager.performCleanup();
    });
  }
});

initializeApp();
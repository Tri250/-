// ============================================
// PawSync Pro - appStateService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用状态服务，处理前后台切换、进程保活
// ============================================

import { useAppStore } from '../store/appStore';

export interface AppStateInfo {
  isActive: boolean;
  lastActiveTime: number;
  backgroundTime: number;
}

class AppStateService {
  private stateInfo: AppStateInfo = {
    isActive: true,
    lastActiveTime: Date.now(),
    backgroundTime: 0
  };

  private listeners: Set<(state: AppStateInfo) => void> = new Set();

  async initialize() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    window.addEventListener('pagehide', this.handlePageHide.bind(this));
    
    window.addEventListener('pageshow', this.handlePageShow.bind(this));
    
    console.log('AppStateService initialized');
  }

  private handleVisibilityChange() {
    const isActive = !document.hidden;
    this.handleStateChange(isActive);
  }

  private handleBeforeUnload() {
    this.onAppPause();
  }

  private handlePageHide() {
    this.onAppPause();
  }

  private handlePageShow() {
    this.onAppResume(0);
  }

  private handleStateChange(isActive: boolean) {
    const now = Date.now();
    
    if (isActive) {
      const backgroundDuration = now - this.stateInfo.lastActiveTime;
      this.stateInfo = {
        isActive: true,
        lastActiveTime: now,
        backgroundTime: backgroundDuration
      };
      
      this.onAppResume(backgroundDuration);
    } else {
      this.stateInfo = {
        isActive: false,
        lastActiveTime: this.stateInfo.lastActiveTime,
        backgroundTime: 0
      };
      
      this.onAppPause();
    }
    
    this.notifyListeners();
  }

  private onAppPause() {
    const store = useAppStore.getState();
    
    localStorage.setItem('pawsync-last-pause-time', Date.now().toString());
    
    if (store.isRecording) {
      store.setIsRecording(false);
    }
    
    console.log('App paused, state saved');
  }

  private onAppResume(backgroundDuration: number) {
    const store = useAppStore.getState();
    
    if (backgroundDuration > 300000) {
      console.log('App resumed after extended background time, reinitializing...');
      store.initializeApp();
    }
    
    if (store.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    console.log(`App resumed after ${backgroundDuration}ms in background`);
  }

  subscribe(listener: (state: AppStateInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.stateInfo));
  }

  getState(): AppStateInfo {
    return this.stateInfo;
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    window.removeEventListener('pagehide', this.handlePageHide.bind(this));
    window.removeEventListener('pageshow', this.handlePageShow.bind(this));
  }
}

export const appStateService = new AppStateService();

export function useAppState() {
  return appStateService.getState();
}
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: (id: number) => clearTimeout(id),
});

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() });
  createAnalyser = vi.fn().mockReturnValue({
    fftSize: 2048,
    getFloatTimeDomainData: vi.fn(),
    connect: vi.fn(),
  });
  close = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);
}

if (typeof window !== 'undefined' && !(window as any).AudioContext) {
  (window as any).AudioContext = MockAudioContext;
  (global as any).AudioContext = MockAudioContext;
}

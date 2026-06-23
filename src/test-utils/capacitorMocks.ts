export const Camera = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  getPhoto: vi.fn(),
};

export const LocalNotifications = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
};

export const Geolocation = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  getCurrentPosition: vi.fn(),
};

export const Preferences = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
};

export const App = {
  openUrl: vi.fn(),
  getInfo: vi.fn(),
};

export const Device = {
  getInfo: vi.fn().mockResolvedValue({ osVersion: '0' }),
};

export const Biometrics = {
  isAvailable: vi.fn(),
  verify: vi.fn(),
};

export const Haptics = {
  impact: vi.fn(),
  notification: vi.fn(),
};

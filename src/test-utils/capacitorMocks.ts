export const Camera = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  getPhoto: vi.fn(),
  CameraResultType: { Base64: 'base64', DataUrl: 'dataUrl', Uri: 'uri' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS', Prompt: 'PROMPT' },
};

export const LocalNotifications = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
  addListener: vi.fn(),
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
  selectionChanged: vi.fn(),
};

export const PushNotifications = {
  requestPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
  register: vi.fn(),
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
};

export const Share = {
  canShare: vi.fn().mockResolvedValue({ value: true }),
  share: vi.fn().mockResolvedValue(undefined),
};

export const Keyboard = {
  show: vi.fn(),
  hide: vi.fn(),
};

export const Capacitor = {
  isNativePlatform: vi.fn().mockReturnValue(false),
  getPlatform: vi.fn().mockReturnValue('web'),
};

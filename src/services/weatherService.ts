// ============================================
// 天气服务 - 实时天气更新
// 使用OpenWeatherMap API
// ============================================

import type {
  CurrentWeather,
  WeatherForecast,
  AirQuality,
  UVIndex,
  OneCallWeather,
  WeatherData,
  WeatherServiceConfig,
  WeatherLocation,
} from '../types/weather';
import { WeatherDescriptionMap, AirQualityLevel, UVIndexLevel } from '../types/weather';

// OpenWeatherMap API配置
const DEFAULT_CONFIG: WeatherServiceConfig = {
  apiKey: '', // 用户需要配置自己的API Key
  unit: 'metric',
  lang: 'zh_cn',
  updateInterval: 10 * 60 * 1000, // 10分钟更新一次
  enableAlerts: true,
  enableAirQuality: true,
};

// API基础URL
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_GEO_URL = 'https://api.openweathermap.org/geo/1.0';
const API_AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
const API_UV_URL = 'https://api.openweathermap.org/data/3.0/onecall';

class WeatherService {
  private config: WeatherServiceConfig;
  private currentLocation: WeatherLocation | null = null;
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Array<(data: WeatherData) => void> = [];
  private lastData: WeatherData | null = null;

  constructor(config: Partial<WeatherServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadConfigFromStorage();
  }

  // 从本地存储加载配置
  private loadConfigFromStorage() {
    try {
      const savedConfig = localStorage.getItem('weather_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsed };
      }

      const savedLocation = localStorage.getItem('weather_location');
      if (savedLocation) {
        this.currentLocation = JSON.parse(savedLocation);
      }
    } catch (error) {
      console.error('Failed to load weather config:', error);
    }
  }

  // 保存配置到本地存储
  private saveConfigToStorage() {
    try {
      localStorage.setItem('weather_config', JSON.stringify(this.config));
      if (this.currentLocation) {
        localStorage.setItem('weather_location', JSON.stringify(this.currentLocation));
      }
    } catch (error) {
      console.error('Failed to save weather config:', error);
    }
  }

  // 设置API Key
  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
    this.saveConfigToStorage();
  }

  // 获取API Key
  getApiKey(): string {
    return this.config.apiKey;
  }

  // 检查是否配置了API Key
  hasApiKey(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 10;
  }

  // 获取当前位置
  getCurrentLocation(): WeatherLocation | null {
    return this.currentLocation;
  }

  // 设置当前位置
  setLocation(location: WeatherLocation) {
    this.currentLocation = location;
    this.saveConfigToStorage();
  }

  // 获取用户当前位置
  async getUserLocation(): Promise<WeatherLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: WeatherLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: '当前位置',
            country: '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
          resolve(location);
        },
        (error) => {
          reject(new Error(`获取位置失败: ${error.message}`));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  // 根据城市名称搜索位置
  async searchLocation(query: string): Promise<WeatherLocation[]> {
    if (!this.hasApiKey()) {
      throw new Error('请先配置OpenWeatherMap API Key');
    }

    const url = `${API_GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${this.config.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`搜索位置失败: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.map((item: {
      name: string;
      lat: number;
      lon: number;
      country: string;
      state?: string;
    }) => ({
      name: item.name,
      lat: item.lat,
      lon: item.lon,
      country: item.country,
      timezone: '',
    }));
  }

  // 反向地理编码 - 根据坐标获取位置名称
  async reverseGeocode(lat: number, lon: number): Promise<WeatherLocation> {
    if (!this.hasApiKey()) {
      throw new Error('请先配置OpenWeatherMap API Key');
    }

    const url = `${API_GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.config.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`反向地理编码失败: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.length === 0) {
      throw new Error('未找到该坐标对应的位置');
    }

    const item = data[0];
    return {
      name: item.name,
      lat: item.lat,
      lon: item.lon,
      country: item.country,
      timezone: '',
    };
  }

  // 获取当前天气
  async getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
    if (!this.hasApiKey()) {
      throw new Error('请先配置OpenWeatherMap API Key');
    }

    const url = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${this.config.unit}&lang=${this.config.lang}&appid=${this.config.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`获取当前天气失败: ${response.statusText}`);
    }

    return response.json();
  }

  // 获取天气预报
  async getForecast(lat: number, lon: number): Promise<WeatherForecast> {
    if (!this.hasApiKey()) {
      throw new Error('请先配置OpenWeatherMap API Key');
    }

    const url = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${this.config.unit}&lang=${this.config.lang}&appid=${this.config.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`获取天气预报失败: ${response.statusText}`);
    }

    return response.json();
  }

  // 获取空气质量
  async getAirQuality(lat: number, lon: number): Promise<AirQuality | null> {
    if (!this.hasApiKey() || !this.config.enableAirQuality) {
      return null;
    }

    try {
      const url = `${API_AIR_URL}?lat=${lat}&lon=${lon}&appid=${this.config.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('获取空气质量失败:', response.statusText);
        return null;
      }

      return response.json();
    } catch (error) {
      console.warn('获取空气质量失败:', error);
      return null;
    }
  }

  // 获取OneCall数据（包含当前、小时、每日预报和警报）
  async getOneCallWeather(lat: number, lon: number): Promise<OneCallWeather> {
    if (!this.hasApiKey()) {
      throw new Error('请先配置OpenWeatherMap API Key');
    }

    const exclude = 'minutely';
    const url = `${API_UV_URL}?lat=${lat}&lon=${lon}&exclude=${exclude}&units=${this.config.unit}&lang=${this.config.lang}&appid=${this.config.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`获取天气数据失败: ${response.statusText}`);
    }

    return response.json();
  }

  // 获取完整的天气数据
  async getFullWeatherData(location?: WeatherLocation): Promise<WeatherData> {
    const loc = location || this.currentLocation;
    
    if (!loc) {
      throw new Error('请先设置位置');
    }

    if (!this.hasApiKey()) {
      throw new Error('请先配置OpenWeatherMap API Key');
    }

    // 并行获取所有数据
    const [oneCall, airQuality] = await Promise.all([
      this.getOneCallWeather(loc.lat, loc.lon),
      this.getAirQuality(loc.lat, loc.lon),
    ]);

    // 转换数据格式
    const weatherData = this.transformWeatherData(oneCall, airQuality, loc);
    
    this.lastData = weatherData;
    this.notifyListeners(weatherData);
    
    return weatherData;
  }

  // 转换天气数据为应用格式
  private transformWeatherData(
    oneCall: OneCallWeather,
    airQuality: AirQuality | null,
    location: WeatherLocation
  ): WeatherData {
    const current = oneCall.current;
    const currentWeather = current.weather[0];

    return {
      location: {
        name: location.name,
        country: location.country,
        lat: location.lat,
        lon: location.lon,
      },
      current: {
        temp: Math.round(current.temp),
        feelsLike: Math.round(current.feels_like),
        humidity: current.humidity,
        pressure: current.pressure,
        windSpeed: current.wind_speed,
        visibility: current.visibility,
        uvIndex: current.uvi,
        condition: currentWeather.main,
        description: WeatherDescriptionMap[currentWeather.description] || currentWeather.description,
        icon: currentWeather.icon,
        sunrise: current.sunrise,
        sunset: current.sunset,
      },
      hourly: oneCall.hourly.slice(0, 24).map(hour => ({
        time: hour.dt,
        temp: Math.round(hour.temp),
        condition: hour.weather[0].main,
        icon: hour.weather[0].icon,
        pop: hour.pop || 0,
      })),
      daily: oneCall.daily.map(day => ({
        date: day.dt,
        tempMin: Math.round(day.temp.min),
        tempMax: Math.round(day.temp.max),
        condition: day.weather[0].main,
        icon: day.weather[0].icon,
        pop: day.pop || 0,
        sunrise: day.sunrise,
        sunset: day.sunset,
      })),
      airQuality: airQuality?.list[0] ? {
        aqi: airQuality.list[0].main.aqi,
        pm25: airQuality.list[0].components.pm2_5,
        pm10: airQuality.list[0].components.pm10,
        o3: airQuality.list[0].components.o3,
        no2: airQuality.list[0].components.no2,
        so2: airQuality.list[0].components.so2,
      } : null,
      alerts: oneCall.alerts?.map(alert => ({
        title: alert.event,
        description: alert.description,
        start: alert.start,
        end: alert.end,
      })) || [],
      lastUpdated: Date.now(),
    };
  }

  // 获取空气质量等级信息
  getAirQualityLevel(aqi: number) {
    const level = AirQualityLevel[aqi as keyof typeof AirQualityLevel];
    return level || { label: '未知', color: '#9ca3af', description: '暂无数据' };
  }

  // 获取UV指数等级信息
  getUVIndexLevel(uvi: number) {
    if (uvi <= 2) return UVIndexLevel.low;
    if (uvi <= 5) return UVIndexLevel.moderate;
    if (uvi <= 7) return UVIndexLevel.high;
    if (uvi <= 10) return UVIndexLevel.veryHigh;
    return UVIndexLevel.extreme;
  }

  // 获取天气图标URL
  getWeatherIconUrl(iconCode: string, size: '1x' | '2x' | '4x' = '2x'): string {
    const sizeMap = { '1x': '', '2x': '@2x', '4x': '@4x' };
    return `https://openweathermap.org/img/wn/${iconCode}${sizeMap[size]}.png`;
  }

  // 开始自动更新
  startAutoUpdate(callback?: (data: WeatherData) => void) {
    // 停止现有的定时器
    this.stopAutoUpdate();

    // 立即获取一次数据
    this.refreshWeatherData().catch(console.error);

    // 设置定时更新
    this.updateTimer = setInterval(() => {
      this.refreshWeatherData().catch(console.error);
    }, this.config.updateInterval);

    // 注册回调
    if (callback) {
      this.addListener(callback);
    }

    console.log(`天气自动更新已启动，更新间隔: ${this.config.updateInterval / 60000}分钟`);
  }

  // 停止自动更新
  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log('天气自动更新已停止');
    }
  }

  // 刷新天气数据
  async refreshWeatherData(): Promise<WeatherData | null> {
    try {
      if (!this.currentLocation) {
        // 尝试获取用户位置
        const location = await this.getUserLocation();
        this.currentLocation = location;
        this.saveConfigToStorage();
      }

      const data = await this.getFullWeatherData();
      console.log('天气数据已更新:', new Date().toLocaleString());
      return data;
    } catch (error) {
      console.error('刷新天气数据失败:', error);
      return null;
    }
  }

  // 添加数据更新监听器
  addListener(callback: (data: WeatherData) => void) {
    this.listeners.push(callback);
    // 如果有缓存数据，立即通知
    if (this.lastData) {
      callback(this.lastData);
    }
  }

  // 移除数据更新监听器
  removeListener(callback: (data: WeatherData) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners(data: WeatherData) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('天气数据监听器执行失败:', error);
      }
    });
  }

  // 获取最后更新的数据
  getLastData(): WeatherData | null {
    return this.lastData;
  }

  // 检查数据是否需要更新
  isDataStale(maxAge: number = this.config.updateInterval): boolean {
    if (!this.lastData) return true;
    return Date.now() - this.lastData.lastUpdated > maxAge;
  }

  // 设置更新间隔
  setUpdateInterval(interval: number) {
    this.config.updateInterval = interval;
    this.saveConfigToStorage();
    
    // 如果正在自动更新，重新启动以应用新间隔
    if (this.updateTimer) {
      this.startAutoUpdate();
    }
  }

  // 获取更新间隔
  getUpdateInterval(): number {
    return this.config.updateInterval;
  }

  // 设置温度单位
  setUnit(unit: 'metric' | 'imperial' | 'standard') {
    this.config.unit = unit;
    this.saveConfigToStorage();
  }

  // 获取温度单位
  getUnit(): string {
    return this.config.unit;
  }

  // 获取温度单位符号
  getUnitSymbol(): string {
    const symbols: Record<string, string> = {
      metric: '°C',
      imperial: '°F',
      standard: 'K',
    };
    return symbols[this.config.unit] || '°C';
  }

  // 格式化温度
  formatTemp(temp: number): string {
    return `${Math.round(temp)}${this.getUnitSymbol()}`;
  }

  // 格式化风速
  formatWindSpeed(speed: number): string {
    if (this.config.unit === 'imperial') {
      return `${speed.toFixed(1)} mph`;
    }
    return `${speed.toFixed(1)} m/s`;
  }

  // 格式化时间
  formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 格式化日期
  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  // 格式化星期
  formatWeekday(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  }

  // 判断是否为白天
  isDaytime(sunrise: number, sunset: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= sunrise && now < sunset;
  }

  // 获取日出日落进度 (0-1)
  getDayProgress(sunrise: number, sunset: number): number {
    const now = Math.floor(Date.now() / 1000);
    const dayLength = sunset - sunrise;
    const elapsed = now - sunrise;
    
    if (now < sunrise) return 0;
    if (now >= sunset) return 1;
    
    return Math.max(0, Math.min(1, elapsed / dayLength));
  }
}

// 导出单例实例
export const weatherService = new WeatherService();

// 导出类供需要自定义配置时使用
export { WeatherService };

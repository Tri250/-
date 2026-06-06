// ============================================
// 天气服务类型定义
// ============================================

export interface WeatherLocation {
  lat: number;
  lon: number;
  name: string;
  country: string;
  timezone?: string;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherMain {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

export interface WeatherWind {
  speed: number;
  deg: number;
  gust?: number;
}

export interface WeatherClouds {
  all: number;
}

export interface WeatherSys {
  type?: number;
  id?: number;
  country: string;
  sunrise: number;
  sunset: number;
}

export interface CurrentWeather {
  coord: { lon: number; lat: number };
  weather: WeatherCondition[];
  base: string;
  main: WeatherMain;
  visibility: number;
  wind: WeatherWind;
  clouds: WeatherClouds;
  dt: number;
  sys: WeatherSys;
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface ForecastItem {
  dt: number;
  main: WeatherMain;
  weather: WeatherCondition[];
  clouds: WeatherClouds;
  wind: WeatherWind;
  visibility: number;
  pop: number; // 降水概率
  dt_txt: string;
}

export interface WeatherForecast {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export interface AirQuality {
  coord: { lon: number; lat: number };
  list: Array<{
    main: { aqi: number };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }>;
}

export interface UVIndex {
  lat: number;
  lon: number;
  date_iso: string;
  date: number;
  value: number;
}

export interface WeatherAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface OneCallWeather {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    weather: WeatherCondition[];
  };
  minutely?: Array<{
    dt: number;
    precipitation: number;
  }>;
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    pop: number;
    weather: WeatherCondition[];
  }>;
  daily: Array<{
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    weather: WeatherCondition[];
    clouds: number;
    pop: number;
    uvi: number;
  }>;
  alerts?: WeatherAlert[];
}

// 应用内部使用的简化天气数据
export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    description: string;
    icon: string;
    sunrise: number;
    sunset: number;
  };
  hourly: Array<{
    time: number;
    temp: number;
    condition: string;
    icon: string;
    pop: number;
  }>;
  daily: Array<{
    date: number;
    tempMin: number;
    tempMax: number;
    condition: string;
    icon: string;
    pop: number;
    sunrise: number;
    sunset: number;
  }>;
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
  } | null;
  alerts: Array<{
    title: string;
    description: string;
    start: number;
    end: number;
  }>;
  lastUpdated: number;
}

export type WeatherUnit = 'metric' | 'imperial' | 'standard';

export interface WeatherServiceConfig {
  apiKey: string;
  unit: WeatherUnit;
  lang: string;
  updateInterval: number; // 毫秒
  enableAlerts: boolean;
  enableAirQuality: boolean;
}

// 天气图标映射
export const WeatherIconMap: Record<string, string> = {
  '01d': 'sun',
  '01n': 'moon',
  '02d': 'cloud-sun',
  '02n': 'cloud-moon',
  '03d': 'cloud',
  '03n': 'cloud',
  '04d': 'clouds',
  '04n': 'clouds',
  '09d': 'cloud-rain',
  '09n': 'cloud-rain',
  '10d': 'cloud-sun-rain',
  '10n': 'cloud-moon-rain',
  '11d': 'bolt',
  '11n': 'bolt',
  '13d': 'snowflake',
  '13n': 'snowflake',
  '50d': 'smog',
  '50n': 'smog',
};

// 天气描述翻译
export const WeatherDescriptionMap: Record<string, string> = {
  'clear sky': '晴朗',
  'few clouds': '少云',
  'scattered clouds': '多云',
  'broken clouds': '阴天',
  'shower rain': '阵雨',
  'rain': '雨',
  'light rain': '小雨',
  'moderate rain': '中雨',
  'heavy rain': '大雨',
  'thunderstorm': '雷雨',
  'snow': '雪',
  'light snow': '小雪',
  'heavy snow': '大雪',
  'mist': '雾',
  'fog': '雾',
  'haze': '霾',
};

// 空气质量等级
export const AirQualityLevel = {
  1: { label: '优', color: '#22c55e', description: '空气质量令人满意，基本无空气污染' },
  2: { label: '良', color: '#eab308', description: '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响' },
  3: { label: '轻度污染', color: '#f97316', description: '易感人群症状有轻度加剧，健康人群出现刺激症状' },
  4: { label: '中度污染', color: '#ef4444', description: '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响' },
  5: { label: '重度污染', color: '#a855f7', description: '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状' },
};

// UV指数等级
export const UVIndexLevel = {
  low: { min: 0, max: 2, label: '低', color: '#22c55e', advice: '无需防护' },
  moderate: { min: 3, max: 5, label: '中等', color: '#eab308', advice: '建议涂抹防晒霜' },
  high: { min: 6, max: 7, label: '高', color: '#f97316', advice: '需要防护，避免正午阳光' },
  veryHigh: { min: 8, max: 10, label: '很高', color: '#ef4444', advice: '必须防护，减少户外活动' },
  extreme: { min: 11, max: 100, label: '极高', color: '#a855f7', advice: '避免户外活动' },
};

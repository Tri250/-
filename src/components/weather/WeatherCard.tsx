// ============================================
// 天气卡片组件 - 显示当前天气
// ============================================

import React, { useState, useEffect } from 'react';
import { useWeatherStore } from '../../store/weatherStore';
import { weatherService } from '../../services/weatherService';
import { Cloud, Sun, Moon, CloudRain, CloudSnow, Wind, Droplets, Eye, Gauge, Sunrise, Sunset, RefreshCw, MapPin, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 工具函数
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 获取天气图标
const getWeatherIcon = (iconCode: string, className?: string) => {
  const isDay = iconCode.endsWith('d');
  
  switch (iconCode.slice(0, 2)) {
    case '01':
      return isDay ? <Sun className={cn("text-yellow-500", className)} /> : <Moon className={cn("text-blue-300", className)} />;
    case '02':
    case '03':
    case '04':
      return <Cloud className={cn("text-gray-400", className)} />;
    case '09':
    case '10':
      return <CloudRain className={cn("text-blue-400", className)} />;
    case '11':
      return <AlertTriangle className={cn("text-yellow-500", className)} />;
    case '13':
      return <CloudSnow className={cn("text-blue-200", className)} />;
    default:
      return <Cloud className={cn("text-gray-400", className)} />;
  }
};

export const WeatherCard: React.FC = () => {
  const { 
    weatherData, 
    currentLocation, 
    isLoading, 
    error, 
    lastUpdated,
    refreshWeather,
    isAutoUpdateEnabled,
    toggleAutoUpdate,
  } = useWeatherStore();

  const [showDetails, setShowDetails] = useState(false);

  // 格式化更新时间
  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return '从未更新';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 如果没有数据，显示配置提示
  if (!weatherData) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-8 h-8 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">天气</h3>
        </div>
        
        {error ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={refreshWeather}
              className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              请在设置中配置天气API Key
            </p>
            <p className="text-xs text-gray-400 mt-1">
              支持 OpenWeatherMap
            </p>
          </div>
        )}
      </div>
    );
  }

  const { current, airQuality, alerts } = weatherData;
  const isDay = weatherService.isDaytime(current.sunrise, current.sunset);
  const dayProgress = weatherService.getDayProgress(current.sunrise, current.sunset);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* 主天气信息 */}
      <div className={cn(
        "p-6 relative",
        isDay ? "bg-gradient-to-br from-blue-400/20 to-orange-300/20" : "bg-gradient-to-br from-indigo-900/40 to-purple-900/40"
      )}>
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
          {getWeatherIcon(current.icon, "w-full h-full")}
        </div>

        {/* 头部 */}
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {currentLocation?.name || '未知位置'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshWeather()}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="刷新天气"
            >
              <RefreshCw className={cn("w-4 h-4 text-gray-600 dark:text-gray-300", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={toggleAutoUpdate}
              className={cn(
                "px-2 py-1 text-xs rounded-full transition-colors",
                isAutoUpdateEnabled 
                  ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                  : "bg-gray-200/50 text-gray-500 dark:text-gray-400"
              )}
            >
              {isAutoUpdateEnabled ? '自动更新中' : '自动更新'}
            </button>
          </div>
        </div>

        {/* 温度显示 */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="text-6xl font-bold text-gray-800 dark:text-white">
            {current.temp}°
          </div>
          <div className="flex flex-col">
            <span className="text-lg text-gray-600 dark:text-gray-300">{current.description}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              体感 {current.feelsLike}°
            </span>
          </div>
        </div>

        {/* 更新时间 */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          更新于 {formatLastUpdated(lastUpdated)}
        </div>

        {/* 日出日落进度条 */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span className="flex items-center gap-1">
              <Sunrise className="w-3 h-3" />
              {weatherService.formatTime(current.sunrise)}
            </span>
            <span className="flex items-center gap-1">
              <Sunset className="w-3 h-3" />
              {weatherService.formatTime(current.sunset)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isDay ? "bg-orange-400" : "bg-indigo-400"
              )}
              style={{ width: `${dayProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{current.humidity}%</div>
            <div className="text-xs text-gray-500">湿度</div>
          </div>
          <div className="text-center">
            <Wind className="w-5 h-5 text-teal-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{current.windSpeed}m/s</div>
            <div className="text-xs text-gray-500">风速</div>
          </div>
          <div className="text-center">
            <Gauge className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{current.pressure}</div>
            <div className="text-xs text-gray-500">气压</div>
          </div>
          <div className="text-center">
            <Eye className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{(current.visibility / 1000).toFixed(1)}km</div>
            <div className="text-xs text-gray-500">能见度</div>
          </div>
        </div>

        {/* 空气质量 */}
        {airQuality && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">空气质量</span>
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${weatherService.getAirQualityLevel(airQuality.aqi).color}20`,
                    color: weatherService.getAirQualityLevel(airQuality.aqi).color 
                  }}
                >
                  {weatherService.getAirQualityLevel(airQuality.aqi).label}
                </span>
                <span className="text-xs text-gray-500">AQI {airQuality.aqi}</span>
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>PM2.5: {airQuality.pm25.toFixed(1)}</span>
              <span>PM10: {airQuality.pm10.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* 天气警报 */}
        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">天气警报</span>
            </div>
            {alerts.slice(0, 2).map((alert, index) => (
              <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg mt-1">
                <strong>{alert.title}</strong>
                <p className="mt-1 line-clamp-2">{alert.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;

// ============================================
// 天气预报组件 - 显示小时和每日预报
// ============================================

import React, { useState } from 'react';
import { useWeatherStore } from '../../store/weatherStore';
import { weatherService } from '../../services/weatherService';
import { Cloud, Sun, Moon, CloudRain, CloudSnow, ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    case '13':
      return <CloudSnow className={cn("text-blue-200", className)} />;
    default:
      return <Cloud className={cn("text-gray-400", className)} />;
  }
};

// 小时预报
const HourlyForecast: React.FC = () => {
  const { weatherData } = useWeatherStore();
  const [scrollPosition, setScrollPosition] = useState(0);

  if (!weatherData?.hourly?.length) return null;

  const hourly = weatherData.hourly.slice(0, 24);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">24小时预报</h4>
        <div className="flex gap-1">
          <button 
            onClick={() => scroll('left')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {hourly.map((hour, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-16 text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 scroll-snap-align-start"
          >
            <div className="text-xs text-gray-500 mb-2">
              {index === 0 ? '现在' : weatherService.formatTime(hour.time)}
            </div>
            <div className="flex justify-center mb-2">
              {getWeatherIcon(hour.icon, "w-6 h-6")}
            </div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {hour.temp}°
            </div>
            {hour.pop > 0 && (
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-blue-500">
                <Droplets className="w-3 h-3" />
                {Math.round(hour.pop * 100)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 每日预报
const DailyForecast: React.FC = () => {
  const { weatherData } = useWeatherStore();

  if (!weatherData?.daily?.length) return null;

  const daily = weatherData.daily.slice(0, 7);

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">7天预报</h4>
      
      <div className="space-y-2">
        {daily.map((day, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
              {index === 0 ? '今天' : weatherService.formatWeekday(day.date)}
            </div>
            
            <div className="flex items-center gap-2 flex-1 justify-center">
              {getWeatherIcon(day.icon, "w-6 h-6")}
              {day.pop > 0.2 && (
                <span className="text-xs text-blue-500">{Math.round(day.pop * 100)}%</span>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-24 justify-end">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {day.tempMax}°
              </span>
              <span className="text-sm text-gray-500">
                {day.tempMin}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WeatherForecast: React.FC = () => {
  const { weatherData } = useWeatherStore();

  if (!weatherData) return null;

  return (
    <div className="glass-card p-4 rounded-2xl">
      <HourlyForecast />
      <DailyForecast />
    </div>
  );
};

export default WeatherForecast;

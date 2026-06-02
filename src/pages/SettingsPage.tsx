import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Palette, 
  Volume2,
  Smartphone,
  Eye,
  Trash2,
  LogOut
} from 'lucide-react';
import { Card } from '../components/DesignSystem';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  const settingsGroups = [
    {
      title: '通知设置',
      items: [
        {
          icon: Bell,
          label: '推送通知',
          description: '接收重要消息提醒',
          type: 'toggle',
          value: notifications,
          onChange: () => setNotifications(!notifications)
        },
        {
          icon: Volume2,
          label: '声音提醒',
          description: '播放提示音',
          type: 'toggle',
          value: soundEnabled,
          onChange: () => setSoundEnabled(!soundEnabled)
        },
      ]
    },
    {
      title: '显示设置',
      items: [
        {
          icon: Moon,
          label: '深色模式',
          description: '切换深色主题',
          type: 'toggle',
          value: darkMode,
          onChange: () => setDarkMode(!darkMode)
        },
        {
          icon: Eye,
          label: '自动播放',
          description: '自动播放视频内容',
          type: 'toggle',
          value: autoPlay,
          onChange: () => setAutoPlay(!autoPlay)
        },
        {
          icon: Palette,
          label: '主题颜色',
          description: '自定义应用主题',
          type: 'link',
          page: 'theme-settings'
        },
      ]
    },
    {
      title: '隐私与安全',
      items: [
        {
          icon: Shield,
          label: '隐私设置',
          description: '管理数据隐私',
          type: 'link',
          page: 'privacy-settings'
        },
        {
          icon: Smartphone,
          label: '设备管理',
          description: '管理已登录设备',
          type: 'link',
          page: 'device-management'
        },
      ]
    },
    {
      title: '其他',
      items: [
        {
          icon: Globe,
          label: '语言设置',
          description: '简体中文',
          type: 'link',
          page: 'language-settings'
        },
        {
          icon: Trash2,
          label: '清除缓存',
          description: '清除本地缓存数据',
          type: 'action',
          action: () => {
            if (confirm('确定要清除缓存吗？')) {
              alert('缓存已清除');
            }
          }
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('profile')}
            className="p-2 -ml-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">设置</h1>
            <p className="text-sm text-white/80">管理应用偏好设置</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">{group.title}</h2>
            <Card className="overflow-hidden">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={itemIndex}
                    className={`flex items-center gap-4 p-4 ${
                      itemIndex !== group.items.length - 1 ? 'border-b border-neutral-100' : ''
                    } ${item.type === 'link' || item.type === 'action' ? 'cursor-pointer hover:bg-neutral-50' : ''}`}
                    onClick={() => {
                      if (item.type === 'link' && item.page) {
                        onNavigate(item.page);
                      } else if (item.type === 'action' && item.action) {
                        item.action();
                      }
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-800">{item.label}</p>
                      <p className="text-xs text-neutral-500">{item.description}</p>
                    </div>
                    {item.type === 'toggle' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onChange?.();
                        }}
                        className={`w-12 h-7 rounded-full transition-all ${
                          item.value ? 'bg-purple-500' : 'bg-neutral-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          item.value ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    )}
                    {item.type === 'link' && (
                      <ChevronLeft className="w-5 h-5 text-neutral-400 rotate-180" />
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))}

        <Card className="overflow-hidden">
          <button 
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                onNavigate('auth');
              }
            }}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-600">退出登录</p>
            </div>
          </button>
        </Card>

        <div className="text-center text-xs text-neutral-400 py-4">
          PawSync Pro v1.0.0
        </div>
      </main>
    </div>
  );
};
import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Volume2,
  Camera,
  Moon,
  HelpCircle,
  ChevronRight,
  Crown,
  CreditCard,
  LogOut,
  Info,
  Sparkles,
} from 'lucide-react';

const privacySettings = [
  { icon: Volume2, label: '麦克风权限', description: '允许录音分析', enabled: true },
  { icon: Camera, label: '相机权限', description: '允许拍照分析', enabled: true },
  { icon: Bell, label: '健康提醒', description: '接收健康异常通知', enabled: true },
];

const subscriptionFeatures = [
  { feature: '24小时健康监测', available: true },
  { feature: 'AI深度情感分析', available: true },
  { feature: '无限翻译次数', available: true },
  { feature: '专属客服支持', available: true },
];

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privacyItems, setPrivacyItems] = useState(privacySettings);

  const togglePrivacy = (index: number) => {
    const updated = [...privacyItems];
    updated[index].enabled = !updated[index].enabled;
    setPrivacyItems(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/50 via-white to-gray-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 text-center">设置</h1>
          <p className="text-xs text-gray-400 text-center">管理您的偏好与隐私</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">用户账号</h2>
              <p className="text-sm text-gray-500">user@example.com</p>
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Pro 会员</span>
              </div>
              <p className="text-sm text-purple-100">已解锁全部高级功能</p>
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              管理订阅
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {subscriptionFeatures.map((item) => (
              <div key={item.feature} className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-purple-50">{item.feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700">隐私设置</h3>
            </div>
          </div>
          {privacyItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => togglePrivacy(index)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </div>
                <button
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    item.enabled ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${
                      item.enabled ? 'left-7 bg-white' : 'left-1 bg-gray-400'
                    }`}
                  />
                </button>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setNotifications(!notifications)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">通知设置</p>
                <p className="text-xs text-gray-400">接收应用通知和提醒</p>
              </div>
            </div>
            <button
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${
                  notifications ? 'left-7 bg-white' : 'left-1 bg-gray-400'
                }`}
              />
            </button>
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Moon className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">深色模式</p>
                <p className="text-xs text-gray-400">切换深色/浅色主题</p>
              </div>
            </div>
            <button
              className={`relative w-12 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-purple-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${
                  darkMode ? 'left-7 bg-white' : 'left-1 bg-gray-400'
                }`}
              />
            </button>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-700">帮助与支持</p>
              <p className="text-xs text-gray-400">常见问题与客服支持</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-t border-gray-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-700">关于我们</p>
              <p className="text-xs text-gray-400">版本信息与隐私政策</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400">PawSync Pro v1.0.0</p>
          <p className="text-xs text-gray-300">带娃的小陈工</p>
          <p className="text-xs text-gray-300">爪印同频 · 守护版</p>
        </div>
      </main>
    </div>
  );
}
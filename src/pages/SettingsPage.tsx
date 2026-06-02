import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Bell, 
  Shield, 
  Moon, 
  Sun,
  Globe, 
  Palette, 
  Volume2,
  VolumeX,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  Info,
  FileText,
  Lock,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Download,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { dataExportManager } from '../services/dataExportService';
import { contentSecurityManager } from '../services/contentSecurityService';
import { permissionManager, PermissionType } from '../services/permissionService';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const fontSizeOptions = [
  { value: 'small', label: '小', description: '适合视力较好的用户' },
  { value: 'medium', label: '中', description: '默认大小' },
  { value: 'large', label: '大', description: '适合需要更大字体的用户' },
];

const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { settings, updateSettings, clearAllData, logout } = useAppStore();
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showUserAgreementModal, setShowUserAgreementModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [permissionStatuses, setPermissionStatuses] = useState<Map<PermissionType, any>>(new Map());
  const [privacySettings, setPrivacySettings] = useState({
    dataAnalysis: true,
    personalizedRecommendations: true,
    locationInfo: false,
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    permissionManager.checkAllPermissions().then(statuses => {
      setPermissionStatuses(statuses);
    });
  }, [settings.darkMode]);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await dataExportManager.downloadExportFile('json');
      showToast('数据导出成功');
      setShowExportModal(false);
    } catch (error) {
      showToast('数据导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      showToast('请输入 DELETE 确认删除');
      return;
    }
    
    setIsDeleting(true);
    try {
      const result = await dataExportManager.deleteAccount();
      if (result.success) {
        showToast(`账号已注销，确认码: ${result.confirmationCode}`);
        setShowDeleteConfirmModal(false);
        setShowDeleteAccountModal(false);
        onNavigate('auth');
      } else {
        showToast('账号注销失败，请联系客服');
      }
    } catch (error) {
      showToast('账号注销失败，请重试');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationInput('');
    }
  };

  const handleRequestPermission = async (type: PermissionType) => {
    const granted = await permissionManager.requestPermission(type);
    if (granted) {
      showToast(`${permissionManager.getConfig(type).description} 权限已开启`);
      const statuses = await permissionManager.checkAllPermissions();
      setPermissionStatuses(statuses);
    } else {
      showToast(permissionManager.getFallbackMessage(type));
    }
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearDataModal(false);
    showToast('数据已清除');
  };

  const handleLogout = () => {
    logout();
    onNavigate('auth');
  };

  const settingsGroups = [
    {
      title: '通知设置',
      items: [
        {
          icon: settings.notifications ? Bell : Bell,
          label: '推送通知',
          description: '接收重要消息提醒',
          type: 'toggle',
          value: settings.notifications,
          onChange: () => {
            updateSettings({ notifications: !settings.notifications });
            showToast(settings.notifications ? '已关闭推送通知' : '已开启推送通知');
          }
        },
        {
          icon: settings.soundEnabled ? Volume2 : VolumeX,
          label: '声音提醒',
          description: settings.soundEnabled ? '已开启提示音' : '已关闭提示音',
          type: 'toggle',
          value: settings.soundEnabled,
          onChange: () => {
            updateSettings({ soundEnabled: !settings.soundEnabled });
            showToast(settings.soundEnabled ? '已关闭声音提醒' : '已开启声音提醒');
          }
        },
      ]
    },
    {
      title: '显示设置',
      items: [
        {
          icon: settings.darkMode ? Moon : Sun,
          label: '主题模式',
          description: settings.darkMode ? '深色模式' : '浅色模式',
          type: 'link',
          onClick: () => setShowThemeModal(true)
        },
        {
          icon: Palette,
          label: '字体大小',
          description: fontSizeOptions.find(f => f.value === settings.fontSize)?.label || '中',
          type: 'link',
          onClick: () => setShowFontSizeModal(true)
        },
        {
          icon: settings.autoPlay ? Eye : EyeOff,
          label: '自动播放',
          description: settings.autoPlay ? '自动播放视频内容' : '不自动播放视频',
          type: 'toggle',
          value: settings.autoPlay,
          onChange: () => {
            updateSettings({ autoPlay: !settings.autoPlay });
            showToast(settings.autoPlay ? '已关闭自动播放' : '已开启自动播放');
          }
        },
      ]
    },
    {
      title: '隐私与安全',
      items: [
        {
          icon: Lock,
          label: '隐私设置',
          description: '管理数据隐私权限',
          type: 'link',
          onClick: () => setShowPrivacyModal(true)
        },
        {
          icon: Smartphone,
          label: '权限管理',
          description: '管理应用权限',
          type: 'link',
          onClick: () => setShowPermissionModal(true)
        },
        {
          icon: Download,
          label: '数据导出',
          description: '导出您的所有数据',
          type: 'link',
          onClick: () => setShowExportModal(true)
        },
        {
          icon: Trash2,
          label: '清除数据',
          description: '清除所有本地数据',
          type: 'action',
          onClick: () => setShowClearDataModal(true)
        },
        {
          icon: UserX,
          label: '账号注销',
          description: '永久删除账号和数据',
          type: 'link',
          onClick: () => setShowDeleteAccountModal(true)
        },
      ]
    },
    {
      title: '语言与地区',
      items: [
        {
          icon: Globe,
          label: '语言设置',
          description: languageOptions.find(l => l.value === settings.language)?.label || '简体中文',
          type: 'link',
          onClick: () => setShowLanguageModal(true)
        },
      ]
    },
    {
      title: '关于',
      items: [
        {
          icon: Info,
          label: '关于应用',
          description: '版本信息',
          type: 'link',
          onClick: () => setShowAboutModal(true)
        },
        {
          icon: FileText,
          label: '用户协议',
          description: '服务条款',
          type: 'link',
          onClick: () => setShowUserAgreementModal(true)
        },
        {
          icon: Shield,
          label: '隐私政策',
          description: '隐私保护说明',
          type: 'link',
          onClick: () => setShowPrivacyPolicyModal(true)
        },
      ]
    }
  ];

  const Modal: React.FC<{
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }> = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen pb-24 ${settings.darkMode ? 'bg-gray-900' : 'bg-neutral-50'}`}>
      <header className={`bg-gradient-to-br from-purple-500 to-pink-500 text-white px-4 py-6`}>
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
            <h2 className={`text-sm font-semibold mb-3 px-1 ${settings.darkMode ? 'text-gray-400' : 'text-neutral-500'}`}>{group.title}</h2>
            <div className={`rounded-2xl overflow-hidden shadow-sm ${settings.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={itemIndex}
                    className={`flex items-center gap-4 p-4 ${
                      itemIndex !== group.items.length - 1 
                        ? settings.darkMode ? 'border-b border-gray-700' : 'border-b border-neutral-100' 
                        : ''
                    } ${(item.type === 'link' || item.type === 'action') ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-gray-700' : ''}`}
                    onClick={() => {
                      if (item.type === 'link' && item.onClick) {
                        item.onClick();
                      } else if (item.type === 'action' && item.onClick) {
                        item.onClick();
                      }
                    }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.darkMode ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                      <Icon className={`w-5 h-5 ${settings.darkMode ? 'text-purple-300' : 'text-purple-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${settings.darkMode ? 'text-white' : 'text-neutral-800'}`}>{item.label}</p>
                      <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-neutral-500'}`}>{item.description}</p>
                    </div>
                    {item.type === 'toggle' && 'value' in item && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.onChange) item.onChange();
                        }}
                        className={`w-12 h-7 rounded-full transition-all ${
                          item.value ? 'bg-purple-500' : settings.darkMode ? 'bg-gray-600' : 'bg-neutral-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          item.value ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    )}
                    {item.type === 'link' && (
                      <ChevronRight className={`w-5 h-5 ${settings.darkMode ? 'text-gray-500' : 'text-neutral-400'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className={`rounded-2xl overflow-hidden shadow-sm ${settings.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-600">退出登录</p>
            </div>
          </button>
        </div>

        <div className={`text-center text-xs py-4 ${settings.darkMode ? 'text-gray-500' : 'text-neutral-400'}`}>
          PawSync Pro v1.0.0
        </div>
      </main>

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50">
          {toastMessage}
        </div>
      )}

      <Modal show={showThemeModal} onClose={() => setShowThemeModal(false)} title="主题模式">
        <div className="space-y-3">
          <button
            onClick={() => {
              updateSettings({ darkMode: false });
              setShowThemeModal(false);
              showToast('已切换到浅色模式');
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${!settings.darkMode ? 'bg-purple-50 border-2 border-purple-500' : 'bg-gray-50'}`}
          >
            <Sun className="w-6 h-6 text-orange-500" />
            <div className="flex-1 text-left">
              <p className="font-medium">浅色模式</p>
              <p className="text-xs text-gray-500">适合日间使用</p>
            </div>
            {!settings.darkMode && <Check className="w-5 h-5 text-purple-500" />}
          </button>
          <button
            onClick={() => {
              updateSettings({ darkMode: true });
              setShowThemeModal(false);
              showToast('已切换到深色模式');
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${settings.darkMode ? 'bg-purple-900/30 border-2 border-purple-500' : 'bg-gray-50'}`}
          >
            <Moon className="w-6 h-6 text-indigo-500" />
            <div className="flex-1 text-left">
              <p className="font-medium">深色模式</p>
              <p className="text-xs text-gray-500">护眼模式，适合夜间使用</p>
            </div>
            {settings.darkMode && <Check className="w-5 h-5 text-purple-500" />}
          </button>
        </div>
      </Modal>

      <Modal show={showFontSizeModal} onClose={() => setShowFontSizeModal(false)} title="字体大小">
        <div className="space-y-3">
          {fontSizeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                updateSettings({ fontSize: option.value as 'small' | 'medium' | 'large' });
                setShowFontSizeModal(false);
                showToast(`字体大小已设置为${option.label}`);
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl ${settings.fontSize === option.value ? 'bg-purple-50 border-2 border-purple-500' : 'bg-gray-50'}`}
            >
              <div className="flex-1 text-left">
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              {settings.fontSize === option.value && <Check className="w-5 h-5 text-purple-500" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal show={showLanguageModal} onClose={() => setShowLanguageModal(false)} title="语言设置">
        <div className="space-y-3">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                updateSettings({ language: option.value as 'zh-CN' | 'en-US' });
                setShowLanguageModal(false);
                showToast(`语言已设置为${option.label}`);
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl ${settings.language === option.value ? 'bg-purple-50 border-2 border-purple-500' : 'bg-gray-50'}`}
            >
              <Globe className="w-6 h-6 text-purple-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">{option.label}</p>
              </div>
              {settings.language === option.value && <Check className="w-5 h-5 text-purple-500" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal show={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="隐私设置">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium">数据分析</p>
              <p className="text-xs text-gray-500">允许收集匿名使用数据以改进产品</p>
            </div>
            <button
              onClick={() => {
                setPrivacySettings(prev => ({ ...prev, dataAnalysis: !prev.dataAnalysis }));
                showToast('设置已更新');
              }}
              className={`w-12 h-7 rounded-full transition-all relative ${privacySettings.dataAnalysis ? 'bg-purple-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${privacySettings.dataAnalysis ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium">个性化推荐</p>
              <p className="text-xs text-gray-500">根据使用习惯推荐内容</p>
            </div>
            <button
              onClick={() => {
                setPrivacySettings(prev => ({ ...prev, personalizedRecommendations: !prev.personalizedRecommendations }));
                showToast('设置已更新');
              }}
              className={`w-12 h-7 rounded-full transition-all relative ${privacySettings.personalizedRecommendations ? 'bg-purple-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${privacySettings.personalizedRecommendations ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium">位置信息</p>
              <p className="text-xs text-gray-500">用于附近宠物服务推荐</p>
            </div>
            <button
              onClick={() => {
                setPrivacySettings(prev => ({ ...prev, locationInfo: !prev.locationInfo }));
                showToast('设置已更新');
              }}
              className={`w-12 h-7 rounded-full transition-all relative ${privacySettings.locationInfo ? 'bg-purple-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${privacySettings.locationInfo ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={showPermissionModal} onClose={() => setShowPermissionModal(false)} title="权限管理">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">通知权限</p>
                <p className="text-xs text-green-600">已开启</p>
              </div>
            </div>
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">相机权限</p>
                <p className="text-xs text-green-600">已开启</p>
              </div>
            </div>
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">麦克风权限</p>
                <p className="text-xs text-green-600">已开启</p>
              </div>
            </div>
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">位置权限</p>
                <p className="text-xs text-yellow-600">仅使用时允许</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </Modal>

      <Modal show={showClearDataModal} onClose={() => setShowClearDataModal(false)} title="清除数据">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-medium text-red-700">警告</p>
              <p className="text-sm text-red-600">此操作将清除所有本地数据，包括翻译记录、宠物信息等，且无法恢复。</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowClearDataModal(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 font-medium"
            >
              取消
            </button>
            <button
              onClick={handleClearData}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium"
            >
              确认清除
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={showAboutModal} onClose={() => setShowAboutModal(false)} title="关于应用">
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-3xl">🐾</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">PawSync Pro</h3>
            <p className="text-gray-500">爪印同频 · 守护版</p>
          </div>
          <div className="py-3 border-t border-b border-gray-100">
            <p className="text-sm text-gray-600">版本 1.0.0 (Build 2026.06.02)</p>
          </div>
          <div className="text-sm text-gray-500 space-y-2">
            <p>一款专为宠物主人设计的智能翻译与健康管理应用</p>
            <p>让爱宠的心声，你能听懂</p>
          </div>
          <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
            <p>© 2026 带娃的小陈工</p>
            <p>保留所有权利</p>
          </div>
        </div>
      </Modal>

      <Modal show={showUserAgreementModal} onClose={() => setShowUserAgreementModal(false)} title="用户协议">
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p><strong>欢迎使用 PawSync Pro</strong></p>
          <p>感谢您选择使用我们的宠物翻译与健康管理应用。在使用本应用前，请仔细阅读以下协议条款。</p>
          <p><strong>一、服务内容</strong></p>
          <p>本应用提供宠物声音翻译、行为分析、健康监测等服务。我们致力于帮助宠物主人更好地理解和照顾自己的宠物。</p>
          <p><strong>二、用户责任</strong></p>
          <p>1. 用户应提供真实、准确的信息。</p>
          <p>2. 用户应妥善保管账号密码。</p>
          <p>3. 用户不得利用本应用从事违法活动。</p>
          <p><strong>三、免责声明</strong></p>
          <p>本应用的翻译结果仅供参考，不构成专业兽医建议。如有健康问题，请咨询专业兽医。</p>
          <p><strong>四、知识产权</strong></p>
          <p>本应用的所有内容（包括但不限于文字、图片、软件等）的知识产权归开发者所有。</p>
          <p><strong>五、协议修改</strong></p>
          <p>我们保留随时修改本协议的权利，修改后的协议将在应用内公布。</p>
          <p className="text-xs text-gray-400 pt-4">最后更新：2026年6月2日</p>
        </div>
      </Modal>

      <Modal show={showPrivacyPolicyModal} onClose={() => setShowPrivacyPolicyModal(false)} title="隐私政策">
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p><strong>PawSync Pro 隐私政策</strong></p>
          <p>我们非常重视您的隐私保护。本政策说明我们如何收集、使用和保护您的个人信息。</p>
          <p><strong>一、信息收集</strong></p>
          <p>我们可能收集以下信息：</p>
          <p>• 账户信息（用户名、邮箱）</p>
          <p>• 宠物信息（名称、品种、年龄）</p>
          <p>• 使用数据（翻译记录、健康数据）</p>
          <p>• 设备信息（设备型号、操作系统）</p>
          <p><strong>二、信息使用</strong></p>
          <p>我们使用收集的信息用于：</p>
          <p>• 提供和改进服务</p>
          <p>• 个性化用户体验</p>
          <p>• 发送重要通知</p>
          <p><strong>三、信息保护</strong></p>
          <p>我们采取多种安全措施保护您的信息，包括数据加密、访问控制等。</p>
          <p><strong>四、信息共享</strong></p>
          <p>未经您的同意，我们不会向第三方共享您的个人信息，法律要求除外。</p>
          <p><strong>五、您的权利</strong></p>
          <p>您有权访问、更正、删除您的个人信息，可在应用设置中操作。</p>
          <p className="text-xs text-gray-400 pt-4">最后更新：2026年6月2日</p>
        </div>
      </Modal>

      <Modal show={showExportModal} onClose={() => setShowExportModal(false)} title="数据导出">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700">
              您可以导出所有个人数据，包括宠物信息、翻译记录、健康数据等。
              导出文件为JSON格式，包含完整的数据备份。
            </p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-medium">导出内容包括：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>用户账户信息</li>
              <li>宠物档案数据</li>
              <li>所有翻译分析记录</li>
              <li>健康提醒历史</li>
              <li>应用设置偏好</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowExportModal(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 font-medium"
              disabled={isExporting}
            >
              取消
            </button>
            <button
              onClick={handleExportData}
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium flex items-center justify-center gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  开始导出
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} title="账号注销">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-medium text-red-700">严重警告</p>
              <p className="text-sm text-red-600">账号注销将永久删除您的所有数据，此操作不可恢复！</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-medium">注销后将删除：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>您的账户信息和登录凭证</li>
              <li>所有宠物档案和照片</li>
              <li>翻译记录和分析历史</li>
              <li>健康数据和提醒设置</li>
              <li>所有本地存储数据</li>
            </ul>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl text-sm text-yellow-700">
            建议：在注销前先导出您的数据备份
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 font-medium"
            >
              取消
            </button>
            <button
              onClick={() => {
                setShowDeleteAccountModal(false);
                setShowDeleteConfirmModal(true);
              }}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium"
            >
              继续注销
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={showDeleteConfirmModal} onClose={() => setShowDeleteConfirmModal(false)} title="最终确认">
        <div className="space-y-4">
          <div className="p-4 bg-red-100 rounded-xl">
            <p className="text-center text-red-700 font-medium">
              请输入 "DELETE" 确认永久删除账号
            </p>
          </div>
          <input
            type="text"
            value={deleteConfirmationInput}
            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
            placeholder="输入 DELETE"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:outline-none text-center font-medium"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setDeleteConfirmationInput('');
              }}
              className="flex-1 py-3 rounded-xl bg-gray-100 font-medium"
              disabled={isDeleting}
            >
              取消
            </button>
            <button
              onClick={handleDeleteAccount}
              className={`flex-1 py-3 rounded-xl font-medium ${
                deleteConfirmationInput === 'DELETE' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-300 text-gray-500'
              }`}
              disabled={isDeleting || deleteConfirmationInput !== 'DELETE'}
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  注销中...
                </span>
              ) : (
                '确认注销'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
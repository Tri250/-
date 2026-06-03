import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Settings, 
  Heart, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  Edit3,
  Camera,
  Moon,
  Palette,
  Globe
} from 'lucide-react';
import { Card } from '../components/DesignSystem';
import { useAppStore } from '../store/appStore';
import { usePetStore } from '../store/petStore';
import { useBondStore } from '../store/bondStore';

interface UserProfilePageProps {
  onNavigate: (page: string) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAppStore();
  const { pets } = usePetStore();
  const { totalPoints, badges, streakDays } = useBondStore();
  
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleSave = () => {
    if (user) {
      useAppStore.getState().setUser({
        ...user,
        username: editUsername
      });
    }
    setEditMode(false);
  };

  const menuItems = [
    { icon: Bell, label: '通知设置', description: '管理消息推送', page: 'settings' },
    { icon: Shield, label: '隐私安全', description: '账户安全设置', page: 'settings' },
    { icon: Palette, label: '主题设置', description: '个性化外观', page: 'settings' },
    { icon: Globe, label: '语言设置', description: '简体中文', page: 'settings' },
    { icon: Moon, label: '深色模式', description: '切换外观模式', page: 'settings' },
    { icon: HelpCircle, label: '帮助中心', description: '常见问题解答', page: 'help-feedback' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="bg-gradient-to-br from-primary-500 to-rose-500 text-white relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        
        <div className="max-w-md mx-auto px-4 pt-6 pb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => onNavigate('home')}
              className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg">个人中心</h1>
            <button 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {showSettingsMenu && (
            <div className="absolute right-4 top-20 bg-white rounded-xl shadow-xl p-2 z-20 w-48">
              <button 
                onClick={() => {
                  setEditMode(true);
                  setShowSettingsMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-neutral-100 rounded-lg flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">编辑资料</span>
              </button>
              <button 
                onClick={() => {
                  logout();
                  onNavigate('home');
                }}
                className="w-full px-4 py-3 text-left hover:bg-neutral-100 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">退出登录</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-6 space-y-5">
        <Card variant="elevated" padding="lg" className="bg-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-rose-100 flex items-center justify-center">
                <User className="w-10 h-10 text-primary-500" />
              </div>
              <button className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="flex-1">
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-2 py-1 text-lg font-bold text-neutral-800 border-b border-primary-300 focus:outline-none"
                  />
                  <p className="text-sm text-neutral-500 mt-1">{user?.email}</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-neutral-800">{user?.username || '用户'}</h2>
                  <p className="text-sm text-neutral-500">{user?.email}</p>
                </>
              )}
            </div>
            <button
              onClick={editMode ? handleSave : () => setEditMode(true)}
              className={`p-2 rounded-full transition-colors ${
                editMode 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center p-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-800">{totalPoints}</p>
            <p className="text-xs text-neutral-500">总积分</p>
          </Card>
          <Card className="text-center p-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-2">
              <div className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-800">{badges.filter(b => b.isUnlocked).length}/{badges.length}</p>
            <p className="text-xs text-neutral-500">徽章</p>
          </Card>
          <Card className="text-center p-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-2">
              <div className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-800">{streakDays}</p>
            <p className="text-xs text-neutral-500">连续天数</p>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">我的毛孩子</h3>
            <button className="text-xs text-primary-500 flex items-center gap-1" onClick={() => onNavigate('pets')}>
              管理
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {pets.map((pet) => (
              <div 
                key={pet.id}
                className="flex-shrink-0 text-center"
                onClick={() => onNavigate('pets')}
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-rose-100 flex items-center justify-center mb-2">
                  {pet.type === 'dog' ? '🐕' : '🐱'}
                </div>
                <p className="text-sm font-medium text-neutral-800">{pet.name}</p>
                <p className="text-xs text-neutral-500">{pet.breed}</p>
              </div>
            ))}
            <button className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center">
              <div className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-neutral-100' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-neutral-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-neutral-800">{item.label}</p>
                <p className="text-xs text-neutral-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
          ))}
        </Card>

        <div className="text-center text-xs text-neutral-400 py-4">
          PawSync Pro v1.0.0
        </div>
      </main>
    </div>
  );
};
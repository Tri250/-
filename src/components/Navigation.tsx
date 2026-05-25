import { Home, MessageCircle, Heart, User } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: '首页' },
  { id: 'translator', icon: MessageCircle, label: '翻译' },
  { id: 'health', icon: Heart, label: '健康' },
  { id: 'profile', icon: User, label: '我的' },
];

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="glass-effect rounded-3xl shadow-soft border border-white/50 px-2 py-2">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    relative flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300
                    ${isActive 
                      ? 'text-white' 
                      : 'text-surface-500 hover:text-surface-700'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 gradient-brand rounded-2xl shadow-glow animate-fadeIn" />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`
                      p-2 rounded-xl transition-all duration-300
                      ${isActive 
                        ? 'bg-white/20 scale-110' 
                        : 'group-hover:bg-surface-100'
                      }
                    `}>
                      <Icon className={`
                        w-6 h-6 transition-transform duration-300
                        ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                      `} />
                    </div>
                    <span className={`
                      text-xs font-semibold transition-all duration-300
                      ${isActive ? 'font-bold' : 'font-medium'}
                    `}>
                      {item.label}
                    </span>
                  </div>
                  
                  {isActive && (
                    <div className="absolute -bottom-1 w-12 h-1 bg-white rounded-full shadow-glow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

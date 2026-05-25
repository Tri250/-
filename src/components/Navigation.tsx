import { Home, MessageCircle, Heart, User } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: '首页', gradient: 'from-orange-400 to-cyan-500' },
  { id: 'translator', icon: MessageCircle, label: '翻译', gradient: 'from-blue-400 to-cyan-500' },
  { id: 'health', icon: Heart, label: '健康', gradient: 'from-green-400 to-emerald-500' },
  { id: 'profile', icon: User, label: '我的', gradient: 'from-purple-400 to-pink-500' },
];

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="glass-effect rounded-3xl shadow-xl border border-white/60 px-2 py-2 backdrop-blur-2xl">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    relative flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-500
                    group
                  `}
                >
                  {isActive && (
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl shadow-glow
                      animate-scale-in
                    `} />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`
                      p-2.5 rounded-xl transition-all duration-500
                      ${isActive 
                        ? 'bg-white/20 scale-110' 
                        : 'group-hover:bg-slate-100 group-hover:scale-110'}
                    `}>
                      <Icon className={`
                        w-6 h-6 transition-all duration-500
                        ${isActive 
                          ? 'text-white scale-110' 
                          : 'text-slate-500 group-hover:text-slate-700'}
                      `} />
                    </div>
                    <span className={`
                      text-[11px] font-bold transition-all duration-500 tracking-tight
                      ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}
                    `}>
                      {item.label}
                    </span>
                  </div>
                  
                  {isActive && (
                    <div className="absolute -bottom-1 w-12 h-1 bg-white rounded-full shadow-lg animate-pulse-soft" />
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

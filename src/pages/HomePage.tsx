import { StatusCard } from '../components/StatusCard';
import { QuickAction } from '../components/QuickAction';
import { useAppStore } from '../store/appStore';
import { Bell, TrendingUp, Activity, Sparkles, Shield, Zap } from 'lucide-react';
import { Badge, GlassCard, GradientButton, PulseDot } from '../components/UIEnhancements';
import { useState } from 'react';

interface HomePageProps {
 onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
 const { currentPet, currentEmotion, healthScore, healthAlerts } = useAppStore();
 const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);
 const lastActivity = '刚刚活跃';
 
 const weeklyHealthData = [
   { day: '周一', score: 65, trend: '+5' },
   { day: '周二', score: 72, trend: '+7' },
   { day: '周三', score: 68, trend: '-4' },
   { day: '周四', score: 78, trend: '+10' },
   { day: '周五', score: 82, trend: '+4' },
   { day: '周六', score: 85, trend: '+3' },
   { day: '周日', score: 88, trend: '+3' },
 ];

 return (
   <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30">
     <header className="sticky top-0 z-40 glass-effect border-b border-surface-200/50">
       <div className="max-w-md mx-auto px-4 py-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-glow animate-float">
               <Sparkles className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-surface-800 tracking-tight">PawSync Pro</h1>
               <p className="text-xs text-surface-500 font-medium">爪印同频 · 守护版</p>
             </div>
           </div>
           <div className="relative">
             <button className="relative p-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-all duration-300 hover:scale-105 active:scale-95">
               <Bell className="w-6 h-6 text-surface-600"/>
               {healthAlerts.length > 0 && (
                 <>
                   <span className="absolute -top-1 -right-1 w-5 h-5 bg-health-danger rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
                     {healthAlerts.length}
                   </span>
                   <span className="absolute -top-1 -right-1 w-5 h-5 bg-health-danger rounded-full animate-ping opacity-75" />
                 </>
               )}
             </button>
           </div>
         </div>
       </div>
     </header>

     <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fadeInUp">
       <StatusCard 
         petName={currentPet?.name || ''} 
         emotion={currentEmotion} 
         healthScore={healthScore} 
         lastActivity={lastActivity}
       />

       <section>
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-bold text-surface-800 flex items-center gap-2">
             <Zap className="w-5 h-5 text-brand-500" />
             快捷操作
           </h2>
         </div>
         <QuickAction onAction={(action) => {
           if (action === 'record' || action === 'photo') {
             onNavigate('translator');
           }
           else if (action === 'health') {
             onNavigate('health');
           }
           else if (action === 'history') {
             onNavigate('profile');
           }
         }}/>
       </section>

       <GlassCard className="space-y-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
               <TrendingUp className="w-5 h-5 text-white" />
             </div>
             <div>
               <h3 className="font-bold text-surface-800">健康趋势</h3>
               <p className="text-xs text-surface-500">近7日数据分析</p>
             </div>
           </div>
           <button className="px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 rounded-lg transition-all duration-300">
             详情
           </button>
         </div>
         
         <div className="space-y-3">
           <div className="flex items-end gap-2 h-24">
             {weeklyHealthData.map((item, index) => (
               <div key={index} className="flex-1 group">
                 <div className="h-full flex flex-col items-center gap-1">
                   <div 
                     className={`w-full rounded-t-lg transition-all duration-500 ${
                       item.score >= 80 ? 'bg-gradient-to-t from-green-400 to-green-300' :
                       item.score >= 60 ? 'bg-gradient-to-t from-brand-400 to-brand-300' :
                       'bg-gradient-to-t from-yellow-400 to-yellow-300'
                     } group-hover:opacity-80`}
                     style={{ height: `${item.score}%`, animationDelay: `${index * 0.1}s` }}
                   />
                   <div className="flex flex-col items-center text-2xs text-surface-400 group-hover:text-surface-600 transition-colors">
                     <span>{item.score}</span>
                     <span className="text-2xs">{item.day}</span>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </GlassCard>

       <GlassCard className="space-y-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
               <Shield className="w-5 h-5 text-white" />
             </div>
             <div>
               <h3 className="font-bold text-surface-800">离家守护</h3>
               <p className="text-xs text-surface-500">实时监测异常行为</p>
             </div>
           </div>
           <button
             onClick={() => setIsProtectionEnabled(!isProtectionEnabled)}
             className={`
               relative w-14 h-7 rounded-full transition-all duration-300
               ${isProtectionEnabled ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-glow' : 'bg-surface-200'}
             `}
           >
             <span 
               className={`
                 absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300
                 ${isProtectionEnabled ? 'left-8' : 'left-1'}
               `} 
             />
           </button>
         </div>
         
         {isProtectionEnabled && (
           <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
             <div className="flex items-start gap-2">
               <PulseDot color="bg-purple-500" />
               <div className="flex-1">
                 <p className="text-sm text-purple-700 font-medium">守护模式已开启</p>
                 <p className="text-xs text-purple-600 mt-1">
                   {currentPet?.name} 的异常行为将被实时监测
                 </p>
               </div>
             </div>
           </div>
         )}
       </GlassCard>

       {healthAlerts.length > 0 && (
         <GlassCard className="border-l-4 border-health-warning space-y-3" glow>
           <div className="flex items-start gap-3">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
               <Bell className="w-6 h-6 text-white" />
             </div>
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 <h3 className="font-bold text-surface-800">健康提醒</h3>
                 <Badge variant="warning" size="sm">新</Badge>
               </div>
               <p className="text-sm text-surface-600">{healthAlerts[0].message}</p>
               <div className="flex items-center gap-2 mt-2">
                 <button 
                   onClick={() => onNavigate('health')}
                   className="text-sm text-brand-500 font-medium hover:text-brand-600 transition-colors"
                 >
                   查看详情
                 </button>
                 <span className="text-surface-300">•</span>
                 <span className="text-xs text-surface-400">{healthAlerts[0].timestamp}</span>
               </div>
             </div>
           </div>
         </GlassCard>
       )}

       <GlassCard className="text-center space-y-3">
         <div className="w-16 h-16 rounded-full gradient-brand mx-auto flex items-center justify-center shadow-glow animate-float">
           <Activity className="w-8 h-8 text-white" />
         </div>
         <div>
           <h3 className="font-bold text-surface-800 mb-1">全天候健康监测</h3>
           <p className="text-sm text-surface-500">智能算法实时分析宠物健康状态</p>
         </div>
         <GradientButton 
           onClick={() => onNavigate('health')}
           variant="primary"
           size="md"
           className="w-full"
           icon={<Shield className="w-5 h-5" />}
         >
           开启智能监测
         </GradientButton>
       </GlassCard>
     </main>
   </div>
 );
}

import { StatusCard } from '../components/StatusCard';
import { QuickAction } from '../components/QuickAction';
import { useAppStore } from '../store/appStore';
import { Bell, ChevronRight, TrendingUp, Moon } from 'lucide-react';
interface HomePageProps {
 onNavigate: (page: string) => void;
}
export function HomePage({ onNavigate }: HomePageProps) {
 const { currentPet, currentEmotion, healthScore, healthAlerts } = useAppStore();
 const lastActivity = '刚刚活跃';
 return (<div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-peach-50/30 pb-20">
 <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-orange-100">
 <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
 <div>
 <h1 className="text-xl font-bold text-gray-800">PawSync Pro</h1>
 <p className="text-xs text-gray-400">爪印同频 · 守护版</p>
 </div>
 <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
 <Bell className="w-6 h-6 text-gray-600"/>
 {healthAlerts.length > 0 && (<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>)}
 </button>
 </div>
 </header>

 <main className="max-w-md mx-auto px-4 py-5 space-y-5">
 <StatusCard petName={currentPet?.name || ''} emotion={currentEmotion} healthScore={healthScore} lastActivity={lastActivity}/>

 <section>
 <h2 className="text-sm font-semibold text-gray-700 mb-3">快捷操作</h2>
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

 <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <TrendingUp className="w-5 h-5 text-green-500"/>
 <h2 className="text-sm font-semibold text-gray-700">健康趋势</h2>
 </div>
 <button className="text-xs text-orange-500 font-medium flex items-center gap-1 hover:text-orange-600">
 查看详情 <ChevronRight className="w-4 h-4"/>
 </button>
 </div>
 <div className="flex items-end gap-2 h-20">
 {[65, 72, 68, 78, 82, 75, 88].map((height, index) => (<div key={index} className="flex-1 bg-gradient-to-t from-orange-400 to-peach-300 rounded-t-md transition-all duration-300 hover:from-orange-500 hover:to-peach-400" style={{ height: `${height}%` }}/>))}
 </div>
 <div className="flex justify-between mt-2 text-xs text-gray-400">
 <span>周一</span>
 <span>周三</span>
 <span>周五</span>
 <span>周日</span>
 </div>
 </section>

 <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <Moon className="w-5 h-5 text-purple-500"/>
 <h2 className="text-sm font-semibold text-gray-700">离家守护</h2>
 </div>
 <button className="relative w-10 h-5 bg-gray-200 rounded-full transition-colors" onClick={() => onNavigate('health')}>
 <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-orange-500 rounded-full shadow transition-transform"/>
 </button>
 </div>
 <p className="text-xs text-gray-500">守护模式已开启，小橘的异常行为将被实时监测</p>
 </section>

 {healthAlerts.length > 0 && (<section className="bg-gradient-to-r from-orange-50 to-peach-50 rounded-2xl p-4 border border-orange-100">
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
 <Bell className="w-4 h-4 text-red-500"/>
 </div>
 <div>
 <h3 className="text-sm font-semibold text-gray-700">健康提醒</h3>
 <p className="text-xs text-gray-500">{healthAlerts[0].message}</p>
 </div>
 </div>
 <button className="text-xs text-orange-500 font-medium" onClick={() => onNavigate('health')}>
 查看
 </button>
 </div>
 </section>)}
 </main>
 </div>);
}


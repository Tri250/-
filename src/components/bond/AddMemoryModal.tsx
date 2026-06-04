// ============================================
// PawSync Pro 3.0 - Add Memory Modal
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 丰富的添加回忆方式 - 符合养宠心得
// ============================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  Mic,
  PenLine,
  Cake,
  MapPin,
  Trophy,
  Heart,
  Stethoscope,
  Sparkles,
  Clock,
  Utensils,
  Gamepad2,
  Users,
  Sun,
  Moon,
  CloudSun,
  PawPrint,
  Baby,
  GraduationCap,
  Home,
  TreePine,
  ShoppingBag,
  Scissors,
  Pill,
  Syringe,
  X,
  ChevronRight,
  Image,
  Calendar,
  Tag,
  Send,
  Smile,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

// 回忆类型定义
interface MemoryType {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

// 养宠心得模板
interface MemoryTemplate {
  id: string;
  icon: React.ReactNode;
  title: string;
  placeholder: string;
  tags: string[];
  category: string;
}

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memory: unknown) => void;
}

export function AddMemoryModal({ isOpen, onClose, onAdd }: AddMemoryModalProps) {
  const { currentPet } = useAppStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const petName = currentPet?.name || '毛孩子';

  // 回忆类型列表 - 丰富的添加方式
  const memoryTypes: MemoryType[] = [
    {
      id: 'photo',
      icon: <Camera className="w-6 h-6" />,
      label: '📸 照片回忆',
      description: '捕捉可爱瞬间',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'video',
      icon: <Video className="w-6 h-6" />,
      label: '🎬 视频记录',
      description: '记录动态时刻',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'voice',
      icon: <Mic className="w-6 h-6" />,
      label: '🎤 声音记忆',
      description: '珍藏独特叫声',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'diary',
      icon: <PenLine className="w-6 h-6" />,
      label: '📝 养宠日记',
      description: '记录日常点滴',
      color: 'text-green-500',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'milestone',
      icon: <Cake className="w-6 h-6" />,
      label: '🎂 里程碑',
      description: '生日、领养日纪念',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50 hover:bg-pink-100'
    },
    {
      id: 'location',
      icon: <MapPin className="w-6 h-6" />,
      label: '📍 打卡地点',
      description: '公园、医院、宠物店',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100'
    },
    {
      id: 'achievement',
      icon: <Trophy className="w-6 h-6" />,
      label: '🏆 成就记录',
      description: '第一次、学会技能',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100'
    },
    {
      id: 'health',
      icon: <Stethoscope className="w-6 h-6" />,
      label: '💊 健康记录',
      description: '就医、疫苗、用药',
      color: 'text-red-500',
      bgColor: 'bg-red-50 hover:bg-red-100'
    }
  ];

  // 养宠心得模板 - 贴心的写作辅助
  const memoryTemplates: MemoryTemplate[] = [
    {
      id: 'fun',
      icon: <Smile className="w-5 h-5" />,
      title: '今日趣事',
      placeholder: `今天${petName}做了什么有趣的事？比如：\n• 发现了新玩具的反应\n• 有趣的睡姿\n• 和其他宠物的互动`,
      tags: ['趣事', '日常', '可爱'],
      category: 'daily'
    },
    {
      id: 'growth',
      icon: <GraduationCap className="w-5 h-5" />,
      title: '成长记录',
      placeholder: `记录${petName}的成长变化：\n• 体重变化\n• 学会的新技能\n• 行为习惯的改变`,
      tags: ['成长', '变化', '记录'],
      category: 'milestone'
    },
    {
      id: 'healing',
      icon: <Heart className="w-5 h-5" />,
      title: '治愈瞬间',
      placeholder: `那些被${petName}治愈的时刻：\n• 累了时的陪伴\n• 难过时的安慰\n• 一个眼神的默契`,
      tags: ['治愈', '陪伴', '感动'],
      category: 'emotion'
    },
    {
      id: 'feeding',
      icon: <Utensils className="w-5 h-5" />,
      title: '喂食心得',
      placeholder: `关于${petName}的饮食：\n• 新尝试的食物\n• 食欲变化\n• 营养搭配心得`,
      tags: ['喂食', '饮食', '营养'],
      category: 'care'
    },
    {
      id: 'training',
      icon: <Gamepad2 className="w-5 h-5" />,
      title: '训练记录',
      placeholder: `训练${petName}的过程：\n• 正在学习的技能\n• 训练方法和效果\n• 进步和困难`,
      tags: ['训练', '学习', '技能'],
      category: 'training'
    },
    {
      id: 'social',
      icon: <Users className="w-5 h-5" />,
      title: '社交互动',
      placeholder: `${petName}的社交生活：\n• 和其他宠物的相处\n• 对陌生人的反应\n• 外出时的表现`,
      tags: ['社交', '互动', '外出'],
      category: 'social'
    },
    {
      id: 'grooming',
      icon: <Scissors className="w-5 h-5" />,
      title: '美容护理',
      placeholder: `护理${petName}的记录：\n• 洗澡、梳毛\n• 剪指甲、清洁耳朵\n• 护理心得`,
      tags: ['护理', '美容', '清洁'],
      category: 'care'
    },
    {
      id: 'sleep',
      icon: <Moon className="w-5 h-5" />,
      title: '睡眠观察',
      placeholder: `${petName}的睡眠情况：\n• 睡姿描述\n• 睡眠时长\n• 有趣的梦境反应`,
      tags: ['睡眠', '休息', '日常'],
      category: 'daily'
    }
  ];

  // 里程碑类型
  const milestoneTypes = [
    { id: 'birthday', icon: <Cake />, label: '生日', emoji: '🎂' },
    { id: 'adoption', icon: <Home />, label: '领养日', emoji: '🏠' },
    { id: 'first_home', icon: <PawPrint />, label: '到家日', emoji: '🐾' },
    { id: 'first_walk', icon: <TreePine />, label: '第一次散步', emoji: '🌳' },
    { id: 'first_food', icon: <Utensils />, label: '第一次吃固体食物', emoji: '🍖' },
    { id: 'vaccine', icon: <Syringe />, label: '疫苗接种', emoji: '💉' },
    { id: 'sterilization', icon: <Pill />, label: '绝育手术', emoji: '🏥' },
    { id: 'recovery', icon: <Heart />, label: '康复纪念', emoji: '❤️' }
  ];

  // 成就类型
  const achievementTypes = [
    { id: 'first', icon: <Baby />, label: '第一次', emoji: '🥇' },
    { id: 'learn', icon: <GraduationCap />, label: '学会技能', emoji: '🎓' },
    { id: 'overcome', icon: <Trophy />, label: '克服困难', emoji: '🏆' },
    { id: 'award', icon: <Sparkles />, label: '获得奖项', emoji: '✨' },
    { id: 'weight_goal', icon: <Heart />, label: '体重达标', emoji: '⚖️' },
    { id: 'social_master', icon: <Users />, label: '社交达人', emoji: '🤝' }
  ];

  // 地点类型
  const locationTypes = [
    { id: 'park', icon: <TreePine />, label: '公园', emoji: '🌳' },
    { id: 'vet', icon: <Stethoscope />, label: '宠物医院', emoji: '🏥' },
    { id: 'shop', icon: <ShoppingBag />, label: '宠物店', emoji: '🛒' },
    { id: 'grooming', icon: <Scissors />, label: '美容店', emoji: '✂️' },
    { id: 'friend', icon: <Home />, label: '朋友家', emoji: '🏠' },
    { id: 'travel', icon: <MapPin />, label: '旅行地', emoji: '✈️' }
  ];

  // 健康记录类型
  const healthTypes = [
    { id: 'checkup', icon: <Stethoscope />, label: '体检', emoji: '🩺' },
    { id: 'vaccine', icon: <Syringe />, label: '疫苗', emoji: '💉' },
    { id: 'deworming', icon: <Pill />, label: '驱虫', emoji: '💊' },
    { id: 'illness', icon: <AlertCircle />, label: '疾病治疗', emoji: '🤒' },
    { id: 'surgery', icon: <Heart />, label: '手术', emoji: '🏥' },
    { id: 'medication', icon: <Pill />, label: '用药记录', emoji: '📋' }
  ];

  // 时间建议
  const getTimeSuggestion = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return { icon: <Sun />, text: '清晨时光', suggestion: '记录晨间互动' };
    if (hour >= 9 && hour < 12) return { icon: <CloudSun />, text: '上午时光', suggestion: '记录上午活动' };
    if (hour >= 12 && hour < 14) return { icon: <Sun />, text: '午间时光', suggestion: '记录午餐时刻' };
    if (hour >= 14 && hour < 18) return { icon: <CloudSun />, text: '下午时光', suggestion: '记录下午活动' };
    if (hour >= 18 && hour < 21) return { icon: <Moon />, text: '傍晚时光', suggestion: '记录散步时光' };
    return { icon: <Moon />, text: '夜晚时光', suggestion: '记录睡前互动' };
  };

  const timeSuggestion = getTimeSuggestion();

  // 处理类型选择
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedTemplate(null);
    setShowTemplates(typeId === 'diary');
  };

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    const template = memoryTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTitle(template.title);
      setTags(template.tags);
    }
  };

  // 处理提交
  const handleSubmit = () => {
    if (!selectedType || !title.trim()) return;

    const memory = {
      id: `memory-${Date.now()}`,
      type: selectedType,
      title,
      content,
      tags,
      location,
      timestamp: new Date().toISOString(),
      petId: currentPet?.id
    };

    onAdd(memory);
    handleClose();
  };

  // 关闭并重置
  const handleClose = () => {
    setSelectedType(null);
    setSelectedTemplate(null);
    setTitle('');
    setContent('');
    setTags([]);
    setLocation('');
    setShowTemplates(false);
    onClose();
  };

  // 渲染类型选择界面
  const renderTypeSelector = () => (
    <div className="space-y-4">
      {/* 时间建议 */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          {timeSuggestion.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{timeSuggestion.text}</p>
          <p className="text-xs text-gray-500">{timeSuggestion.suggestion}</p>
        </div>
      </div>

      {/* 类型网格 */}
      <div className="grid grid-cols-2 gap-3">
        {memoryTypes.map((type) => (
          <motion.button
            key={type.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTypeSelect(type.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${type.bgColor} ${
              selectedType === type.id ? 'border-current shadow-md' : 'border-transparent'
            }`}
          >
            <div className={`mb-2 ${type.color}`}>{type.icon}</div>
            <p className="font-medium text-gray-800 text-sm">{type.label}</p>
            <p className="text-xs text-gray-500 mt-1">{type.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );

  // 渲染照片/视频上传界面
  const renderMediaUpload = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
          {selectedType === 'photo' ? <Camera className="w-10 h-10 text-blue-500" /> : <Video className="w-10 h-10 text-purple-500" />}
        </div>
        <p className="text-gray-600 mb-4">
          {selectedType === 'photo' ? '选择或拍摄照片' : '选择或录制视频'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="py-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex flex-col items-center gap-2 transition-colors"
        >
          <Image className="w-6 h-6 text-blue-500" />
          <span className="text-sm text-gray-700">从相册选择</span>
        </button>
        <button
          onClick={() => {}}
          className="py-4 bg-purple-50 hover:bg-purple-100 rounded-xl flex flex-col items-center gap-2 transition-colors"
        >
          {selectedType === 'photo' ? <Camera className="w-6 h-6 text-purple-500" /> : <Video className="w-6 h-6 text-purple-500" />}
          <span className="text-sm text-gray-700">{selectedType === 'photo' ? '立即拍照' : '立即录制'}</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={selectedType === 'photo' ? 'image/*' : 'video/*'}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            console.log('Selected file:', file);
          }
        }}
      />

      {/* 标题输入 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">添加描述</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给这个回忆起个名字..."
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
        />
      </div>
    </div>
  );

  // 渲染声音录制界面
  const renderVoiceRecorder = () => (
    <div className="space-y-4">
      <div className="text-center">
        <motion.div
          animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4"
        >
          <Mic className={`w-12 h-12 ${isRecording ? 'text-red-500' : 'text-orange-500'}`} />
        </motion.div>
      </div>

      {!isRecording ? (
        <button
          onClick={() => setIsRecording(true)}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl flex items-center justify-center gap-2"
        >
          <Mic className="w-5 h-5" />
          <span>开始录音</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1 h-16">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [20, 40 + Math.random() * 30, 20] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                className="w-1.5 bg-gradient-to-t from-orange-500 to-red-500 rounded-full"
              />
            ))}
          </div>
          <button
            onClick={() => setIsRecording(false)}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2"
          >
            <span>停止录音</span>
          </button>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">声音描述</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="这是什么声音？"
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
        />
      </div>
    </div>
  );

  // 渲染日记界面
  const renderDiaryEditor = () => (
    <div className="space-y-4">
      {/* 模板选择 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">选择模板</p>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-xs text-pink-500 flex items-center gap-1"
        >
          {showTemplates ? '收起' : '展开模板'}
          <ChevronRight className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="grid grid-cols-2 gap-2 overflow-hidden"
          >
            {memoryTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedTemplate === template.id
                    ? 'bg-pink-100 border-2 border-pink-300'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500">{template.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{template.title}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标题 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="今天发生了什么..."
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-green-300 focus:ring-2 focus:ring-green-100 outline-none transition-all"
        />
      </div>

      {/* 内容 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">详细记录</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            selectedTemplate
              ? memoryTemplates.find(t => t.id === selectedTemplate)?.placeholder
              : `详细描述${petName}今天的情况...`
          }
          rows={5}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-green-300 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
        />
      </div>

      {/* 标签 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">标签</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
            >
              #{tag}
              <button
                onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="添加标签..."
            className="flex-1 min-w-[100px] px-3 py-1 bg-gray-50 rounded-full text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && !tags.includes(value)) {
                  setTags([...tags, value]);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  // 渲染里程碑界面
  const renderMilestoneSelector = () => (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">选择里程碑类型</p>
      <div className="grid grid-cols-2 gap-2">
        {milestoneTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setTitle(`${type.emoji} ${type.label}`)}
            className={`p-3 rounded-xl text-left transition-all ${
              title.includes(type.label)
                ? 'bg-pink-100 border-2 border-pink-300'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <span className="text-2xl mb-1 block">{type.emoji}</span>
            <span className="text-sm font-medium text-gray-800">{type.label}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">日期</label>
        <input
          type="date"
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">纪念描述</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录这个特殊时刻..."
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );

  // 渲染成就界面
  const renderAchievementSelector = () => (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">选择成就类型</p>
      <div className="grid grid-cols-2 gap-2">
        {achievementTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setTitle(`${type.emoji} ${type.label}`)}
            className={`p-3 rounded-xl text-left transition-all ${
              title.includes(type.label)
                ? 'bg-yellow-100 border-2 border-yellow-300'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <span className="text-2xl mb-1 block">{type.emoji}</span>
            <span className="text-sm font-medium text-gray-800">{type.label}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">成就描述</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`${petName}做到了什么？`}
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );

  // 渲染地点打卡界面
  const renderLocationSelector = () => (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">选择地点类型</p>
      <div className="grid grid-cols-2 gap-2">
        {locationTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setTitle(`${type.emoji} 去${type.label}`);
              setLocation(type.label);
            }}
            className={`p-3 rounded-xl text-left transition-all ${
              location === type.label
                ? 'bg-cyan-100 border-2 border-cyan-300'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <span className="text-2xl mb-1 block">{type.emoji}</span>
            <span className="text-sm font-medium text-gray-800">{type.label}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">详细地址</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="输入具体地点..."
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">打卡心得</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`这次去${location || '这里'}发生了什么？`}
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );

  // 渲染健康记录界面
  const renderHealthSelector = () => (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">选择健康记录类型</p>
      <div className="grid grid-cols-2 gap-2">
        {healthTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setTitle(`${type.emoji} ${type.label}`)}
            className={`p-3 rounded-xl text-left transition-all ${
              title.includes(type.label)
                ? 'bg-red-100 border-2 border-red-300'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
            <span className="text-2xl mb-1 block">{type.emoji}</span>
            <span className="text-sm font-medium text-gray-800">{type.label}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">日期</label>
        <input
          type="date"
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">详细记录</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录详细信息..."
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );

  // 根据类型渲染内容
  const renderTypeContent = () => {
    switch (selectedType) {
      case 'photo':
      case 'video':
        return renderMediaUpload();
      case 'voice':
        return renderVoiceRecorder();
      case 'diary':
        return renderDiaryEditor();
      case 'milestone':
        return renderMilestoneSelector();
      case 'achievement':
        return renderAchievementSelector();
      case 'location':
        return renderLocationSelector();
      case 'health':
        return renderHealthSelector();
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          >
            {/* 头部 */}
            <div className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedType && (
                    <button
                      onClick={() => setSelectedType(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                  <h2 className="text-lg font-bold text-gray-800">
                    {selectedType
                      ? memoryTypes.find(t => t.id === selectedType)?.label
                      : '添加回忆'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!selectedType ? renderTypeSelector() : renderTypeContent()}
            </div>

            {/* 底部操作 */}
            {selectedType && (
              <div className="sticky bottom-0 bg-white z-10 px-4 py-4 border-t border-gray-100">
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  <span>保存回忆</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AddMemoryModal;

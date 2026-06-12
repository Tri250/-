// ============================================
// PawSync Pro - TrainingPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 宠物训练页面 - 完整功能实现
// ============================================

import { useState, useRef } from 'react';
import { GraduationCap, Play, CheckCircle, Clock, Award, ChevronRight, Star, Lock, Trophy, Target, Zap, BookOpen, Pause, RotateCcw, X, ArrowLeft, Flame, Heart } from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';
import { useBondStore } from '../store/bondStore';
import { usePetStore } from '../store/petStore';
import { Card, Button, Badge, GlassModal, ProgressRing } from '../components/DesignSystem';
import { useResponsiveStyle } from '../lib/responsiveStyle';

export default function TrainingPage() {
  const { courses, currentSession, trainingRecords, totalTrainingTime, streakDays, startSession, completeStep, endSession, updateCourseProgress } = useTrainingStore();
  const { addDailyActivity, unlockBadge } = useBondStore();
  const { pets, selectedPetId } = usePetStore();
  const responsive = useResponsiveStyle();
  
  const [activeCategory, setActiveCategory] = useState<'all' | 'basic' | 'behavior' | 'trick' | 'social'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [trainingNotes, setTrainingNotes] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingTimer, setTrainingTimer] = useState(0);
  const [activeTab, setActiveTab] = useState<'courses' | 'records' | 'achievements'>('courses');
  const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const filteredCourses = activeCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === activeCategory);

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  // 计算成就统计
  const totalCompletedCourses = (courses || []).filter(c => c?.progress === 100).length;
  const totalPointsEarned = (trainingRecords || []).reduce((sum, r) => sum + (r?.success ? 50 : 0), 0);
  const averageSuccessRate = (trainingRecords || []).length > 0 
    ? Math.round(((trainingRecords || []).filter(r => r?.success).length / (trainingRecords || []).length) * 100)
    : 0;

  const handleStartCourse = (courseId: string) => {
    if (courses.find(c => c.id === courseId)?.isPremium) {
      return;
    }
    
    setSelectedCourse(courseId);
    setShowTrainingModal(true);
    setCurrentStep(0);
    setTrainingNotes('');
    setTrainingTimer(0);
    setIsTraining(false);
  };

  const handleBeginTraining = () => {
    if (!selectedCourse) return;
    
    startSession(selectedCourse);
    setIsTraining(true);
    
    // 模拟计时器
    trainingIntervalRef.current = setInterval(() => {
      setTrainingTimer(prev => prev + 1);
    }, 1000);
  };

  const handleCompleteStep = () => {
    if (!selectedCourse || !selectedCourseData) return;
    
    const newStep = currentStep + 1;
    setCurrentStep(newStep);
    
    completeStep(`step-${newStep}`);
    updateCourseProgress(selectedCourse, Math.min(newStep, selectedCourseData.totalSteps));
    
    // 添加积分
    addDailyActivity({
      type: 'training',
      description: `完成训练步骤 ${newStep}`,
      points: 10
    });
    
    // 检查是否完成所有步骤
    if (newStep >= selectedCourseData.totalSteps) {
      handleFinishTraining();
    }
  };

  const handlePauseTraining = () => {
    setIsTraining(false);
    if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }
  };

  const handleResumeTraining = () => {
    setIsTraining(true);
    trainingIntervalRef.current = setInterval(() => {
      setTrainingTimer(prev => prev + 1);
    }, 1000);
  };

  const handleFinishTraining = () => {
    if (!selectedCourse) return;
    
    setIsTraining(false);
    if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }
    
    endSession(trainingNotes);
    
    // 完成训练获得徽章
    unlockBadge('3');
    
    // 添加活动记录
    addDailyActivity({
      type: 'training',
      description: `完成训练课程`,
      points: 50
    });
    
    setShowTrainingModal(false);
    setSelectedCourse(null);
  };

  const handleCancelTraining = () => {
    setIsTraining(false);
    if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }
    setShowTrainingModal(false);
    setSelectedCourse(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basic: '基础',
      behavior: '行为',
      trick: '技能',
      social: '社交'
    };
    return labels[category] || category;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    };
    return colors[difficulty] || 'default';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      beginner: '入门',
      intermediate: '进阶',
      advanced: '高级'
    };
    return labels[difficulty] || difficulty;
  };

  // 模拟训练步骤数据
  const getTrainingSteps = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return [];
    
    const steps = [];
    for (let i = 1; i <= course.totalSteps; i++) {
      steps.push({
        id: `step-${i}`,
        title: `步骤 ${i}: ${getStepTitle(course.category, i)}`,
        description: getStepDescription(course.category, i),
        duration: Math.round(course.duration / course.totalSteps),
        tips: getStepTips(course.category, i),
        isCompleted: i <= course.completedSteps
      });
    }
    return steps;
  };

  const getStepTitle = (category: string, step: number) => {
    const titles: Record<string, Record<number, string>> = {
      basic: { 1: '准备训练环境', 2: '建立注意力', 3: '坐下命令', 4: '握手训练', 5: '巩固练习' },
      behavior: { 1: '识别问题行为', 2: '建立替代行为', 3: '正向强化', 4: '消除负面行为', 5: '持续训练' },
      trick: { 1: '基础动作', 2: '动作分解', 3: '逐步练习', 4: '组合动作', 5: '流畅完成' },
      social: { 1: '接触新环境', 2: '熟悉陌生人', 3: '与其他宠物互动', 4: '公共场所训练', 5: '巩固社交能力' }
    };
    return titles[category]?.[step] || `训练步骤 ${step}`;
  };

  const getStepDescription = (category: string, step: number) => {
    const descriptions: Record<string, Record<number, string>> = {
      basic: {
        1: '选择安静、无干扰的环境，准备好奖励零食',
        2: '使用声音或手势吸引宠物注意力，保持眼神接触',
        3: '发出"坐下"命令，配合手势引导宠物坐下',
        4: '伸出手掌，引导宠物用爪子触碰你的手',
        5: '重复练习所有命令，增加训练难度'
      },
      behavior: {
        1: '观察并记录宠物的问题行为触发因素',
        2: '教导宠物正确的行为替代问题行为',
        3: '使用奖励强化正确行为',
        4: '逐步减少问题行为的发生',
        5: '持续监控并巩固训练效果'
      },
      trick: {
        1: '从简单的动作开始，如转圈或跳跃',
        2: '将复杂动作分解为多个小步骤',
        3: '逐步练习每个分解动作',
        4: '将分解动作组合成完整技能',
        5: '让宠物流畅完成整个技能'
      },
      social: {
        1: '带宠物到新的环境，让它适应陌生气味和声音',
        2: '让宠物接触友善的陌生人，建立信任',
        3: '安排与其他友善宠物互动的机会',
        4: '带宠物到公园等公共场所练习',
        5: '在各种环境下巩固社交能力'
      }
    };
    return descriptions[category]?.[step] || '完成训练步骤';
  };

  const getStepTips = (category: string, step: number): string[] => {
    return [
      '保持耐心，不要急躁',
      '使用正向强化方法',
      '每次训练时间不宜过长',
      '及时给予奖励和表扬'
    ];
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-6 py-8" style={{ paddingTop: responsive.safeAreaPadding.paddingTop + 32 }}>
        <div style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          <h1 className="text-2xl font-bold mb-2">宠物训练</h1>
          <p className="text-purple-100 mb-6">AI 个性化训练，让您的爱宠更聪明</p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="gradient" padding="md" className="bg-white/20 backdrop-blur border-0">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm">训练时长</span>
              </div>
              <div className="text-2xl font-bold">{totalTrainingTime} 分钟</div>
            </Card>
            <Card variant="gradient" padding="md" className="bg-white/20 backdrop-blur border-0">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5" />
                <span className="text-sm">连续训练</span>
              </div>
              <div className="text-2xl font-bold">{streakDays} 天</div>
            </Card>
          </div>
          
          {/* Achievement Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm">完成课程</div>
              <div className="text-lg font-bold">{totalCompletedCourses}</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm">获得积分</div>
              <div className="text-lg font-bold">{totalPointsEarned}</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm">成功率</div>
              <div className="text-lg font-bold">{averageSuccessRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 sticky top-0 bg-neutral-50 z-10">
        <div className="flex gap-2" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          {(['courses', 'records', 'achievements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab === 'courses' ? '训练课程' : tab === 'records' ? '训练记录' : '成就'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['all', 'basic', 'behavior', 'trick', 'social'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {category === 'all' ? '全部' : getCategoryLabel(category)}
                </button>
              ))}
            </div>

            {/* Course List */}
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  variant="default"
                  padding="lg"
                  hover
                  onClick={() => handleStartCourse(course.id)}
                  enableGlow={course.progress === 100}
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getDifficultyColor(course.difficulty) as any} size="sm">
                          {getDifficultyLabel(course.difficulty)}
                        </Badge>
                        {course.isPremium && (
                          <Badge variant="warning" size="sm">
                            <Star className="w-3 h-3 mr-1" />
                            会员
                          </Badge>
                        )}
                        {course.progress === 100 && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            已完成
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-neutral-800 mb-1">{course.title}</h3>
                      <p className="text-neutral-500 text-sm mb-3">{course.description}</p>
                    </div>
                    <div className="ml-4">
                      {course.progress > 0 && course.progress < 100 ? (
                        <ProgressRing progress={course.progress} size={48} strokeWidth={4} />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {course.progress > 0 && course.progress < 100 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">进度</span>
                        <span className="font-medium text-purple-600">{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Course Info */}
                  <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration} 分钟
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.completedSteps}/{course.totalSteps} 步骤
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      +{course.rewardPoints} 积分
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={course.isPremium ? 'ghost' : 'primary'}
                    size="md"
                    fullWidth
                    disabled={course.isPremium}
                    icon={course.isPremium ? <Lock className="w-4 h-4" /> : course.progress > 0 ? <Play className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                  >
                    {course.isPremium ? '会员专享' : course.progress > 0 ? '继续训练' : '开始训练'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">训练记录</h2>
              <Badge variant="purple" size="md">
                {trainingRecords.length} 条记录
              </Badge>
            </div>

            {trainingRecords.length === 0 ? (
              <Card variant="outlined" padding="lg">
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">暂无训练记录</p>
                  <p className="text-neutral-400 text-sm mt-2">开始训练后，记录将自动保存</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {trainingRecords.map((record) => (
                  <Card key={record.id} variant="default" padding="md" hover>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          record.success ? 'bg-success-100' : 'bg-warning-100'
                        }`}>
                          {record.success ? (
                            <CheckCircle className="w-5 h-5 text-success-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-warning-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-800">{record.courseTitle}</h3>
                          <p className="text-sm text-neutral-500">{record.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant={record.success ? 'success' : 'warning'} size="sm">
                        {record.success ? '成功' : '进行中'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {record.duration} 分钟
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        +{record.success ? 50 : 10} 积分
                      </div>
                    </div>
                    
                    {record.notes && (
                      <p className="text-sm text-neutral-500 mt-2 p-2 bg-neutral-50 rounded-lg">
                        {record.notes}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {/* Achievement Summary */}
            <Card variant="gradient" padding="lg">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-neutral-800 mb-2">训练成就</h3>
                <p className="text-neutral-500 text-sm">继续训练，解锁更多成就徽章</p>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <ProgressRing progress={Math.min(totalCompletedCourses * 20, 100)} size={64} strokeWidth={6} color="#8B5CF6" />
                    <p className="text-sm text-neutral-600 mt-2">课程大师</p>
                    <p className="text-xs text-neutral-400">{totalCompletedCourses}/5</p>
                  </div>
                  <div className="text-center">
                    <ProgressRing progress={Math.min(streakDays * 10, 100)} size={64} strokeWidth={6} color="#F59E0B" />
                    <p className="text-sm text-neutral-600 mt-2">坚持不懈</p>
                    <p className="text-xs text-neutral-400">{streakDays}/10天</p>
                  </div>
                  <div className="text-center">
                    <ProgressRing progress={Math.min(totalPointsEarned / 10, 100)} size={64} strokeWidth={6} color="#10B981" />
                    <p className="text-sm text-neutral-600 mt-2">积分达人</p>
                    <p className="text-xs text-neutral-400">{totalPointsEarned}/1000</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Achievement List */}
            <div className="space-y-3">
              {[
                { id: 1, title: '初学者', desc: '完成第一个训练课程', icon: GraduationCap, unlocked: totalCompletedCourses >= 1, progress: Math.min(totalCompletedCourses, 1) },
                { id: 2, title: '训练达人', desc: '完成5个训练课程', icon: Trophy, unlocked: totalCompletedCourses >= 5, progress: Math.min(totalCompletedCourses, 5) },
                { id: 3, title: '坚持不懈', desc: '连续训练10天', icon: Flame, unlocked: streakDays >= 10, progress: Math.min(streakDays, 10) },
                { id: 4, title: '积分大师', desc: '获得1000积分', icon: Star, unlocked: totalPointsEarned >= 1000, progress: Math.min(Math.round(totalPointsEarned / 200), 5) },
                { id: 5, title: '完美训练', desc: '训练成功率达到90%', icon: Target, unlocked: averageSuccessRate >= 90, progress: Math.round(averageSuccessRate / 20) }
              ].map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <Card key={achievement.id} variant="default" padding="md" className={!achievement.unlocked ? 'opacity-60' : ''}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        achievement.unlocked ? 'bg-purple-100' : 'bg-neutral-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${achievement.unlocked ? 'text-purple-600' : 'text-neutral-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-neutral-800">{achievement.title}</h4>
                          {achievement.unlocked && (
                            <CheckCircle className="w-4 h-4 text-success-500" />
                          )}
                        </div>
                        <p className="text-sm text-neutral-500">{achievement.desc}</p>
                        {!achievement.unlocked && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-400 transition-all"
                                style={{ width: `${(achievement.progress / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Training Modal */}
      <GlassModal
        isOpen={showTrainingModal}
        onClose={handleCancelTraining}
        title={selectedCourseData?.title || '训练课程'}
        size="lg"
      >
        {selectedCourseData && (
          <div className="space-y-4">
            {/* Course Info */}
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-800">{selectedCourseData.title}</h4>
                <p className="text-sm text-neutral-500">{selectedCourseData.description}</p>
              </div>
            </div>

            {/* Training Timer */}
            {isTraining && (
              <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                <div className="text-4xl font-bold mb-2">{formatTime(trainingTimer)}</div>
                <p className="text-purple-100">训练进行中</p>
              </div>
            )}

            {/* Training Steps */}
            {!isTraining ? (
              <div>
                <h4 className="font-bold text-neutral-800 mb-3">训练步骤</h4>
                <div className="space-y-2">
                  {getTrainingSteps(selectedCourse).map((step, index) => (
                    <div 
                      key={step.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        step.isCompleted 
                          ? 'border-success-200 bg-success-50' 
                          : index === currentStep 
                            ? 'border-purple-200 bg-purple-50' 
                            : 'border-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          step.isCompleted ? 'bg-success-100' : 'bg-neutral-100'
                        }`}>
                          {step.isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-success-600" />
                          ) : (
                            <span className="text-sm font-medium text-neutral-600">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-neutral-800">{step.title}</h5>
                          <p className="text-sm text-neutral-500">{step.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-neutral-400">
                          <Clock className="w-4 h-4" />
                          {step.duration}分钟
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Current Step Detail */}
                <div className="p-4 bg-purple-50 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-purple-700">当前步骤</span>
                  </div>
                  <h4 className="font-bold text-neutral-800 mb-2">
                    {getTrainingSteps(selectedCourse)[currentStep]?.title}
                  </h4>
                  <p className="text-neutral-600 mb-3">
                    {getTrainingSteps(selectedCourse)[currentStep]?.description}
                  </p>
                  
                  {/* Tips */}
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-neutral-700 mb-2">训练提示:</p>
                    <ul className="space-y-1">
                      {getTrainingSteps(selectedCourse)[currentStep]?.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                          <Heart className="w-3 h-3 text-purple-400 mt-1" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">训练进度</span>
                    <span className="font-medium text-purple-600">{currentStep}/{selectedCourseData.totalSteps}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                      style={{ width: `${(currentStep / selectedCourseData.totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">训练笔记</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                placeholder="记录训练过程中的观察和心得..."
                rows={3}
                value={trainingNotes}
                onChange={(e) => setTrainingNotes(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isTraining ? (
                <>
                  <Button variant="ghost" size="lg" fullWidth onClick={handleCancelTraining}>
                    取消
                  </Button>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    onClick={handleBeginTraining}
                    icon={<Play className="w-4 h-4" />}
                  >
                    开始训练
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="lg" onClick={handlePauseTraining}>
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleCancelTraining}
                    icon={<X className="w-4 h-4" />}
                  >
                    结束
                  </Button>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth 
                    onClick={handleCompleteStep}
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    完成步骤
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </GlassModal>

      <div className="h-8" />
    </div>
  );
}
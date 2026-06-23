// ============================================
// PawSync Pro - TrainingPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 宠物训练页面
// ============================================

import { useState, useEffect } from 'react';
import { GraduationCap, Play, CheckCircle, Clock, Award, ChevronRight, Star, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';
import { useBondStore } from '../store/bondStore';
import { EmptyState } from '../components/EmptyState';

export default function TrainingPage() {
  const { courses, totalTrainingTime, streakDays, startSession, fetchCourses, fetchTrainingRecords, loading, error } = useTrainingStore();
  const { addDailyActivity, unlockBadge } = useBondStore();
  const [activeCategory, setActiveCategory] = useState<'all' | 'basic' | 'behavior' | 'trick' | 'social'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchTrainingRecords();
  }, [fetchCourses, fetchTrainingRecords]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCourses(), fetchTrainingRecords()]);
    setIsRefreshing(false);
  };

  const filteredCourses = activeCategory === 'all'
    ? courses
    : courses.filter(course => course.category === activeCategory);

  const handleStartCourse = (courseId: string) => {
    startSession(courseId);
    addDailyActivity({
      type: 'training',
      description: '开始训练课程',
      points: 10,
    });
    unlockBadge('3');
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      basic: '基础',
      behavior: '行为',
      trick: '技能',
      social: '社交',
    };
    return labels[category] || category;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      beginner: '入门',
      intermediate: '进阶',
      advanced: '高级',
    };
    return labels[difficulty] || difficulty;
  };

  const renderSkeleton = () => (
    <div className="px-4 max-w-md mx-auto space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-5 bg-neutral-200 rounded w-12" />
                <div className="h-5 bg-neutral-200 rounded w-16" />
              </div>
              <div className="h-5 bg-neutral-200 rounded w-2/3" />
              <div className="h-4 bg-neutral-100 rounded w-full" />
            </div>
            <div className="w-12 h-12 bg-neutral-200 rounded-2xl" />
          </div>
          <div className="h-8 bg-neutral-100 rounded mb-4" />
          <div className="h-10 bg-neutral-200 rounded" />
        </div>
      ))}
    </div>
  );

  if (error && courses.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-6 py-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-2">宠物训练</h1>
            <p className="text-purple-100 mb-6">AI 个性化训练，让您的爱宠更聪明</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">加载失败</h2>
          <p className="text-neutral-500 text-sm mb-6 text-center">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-6 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">宠物训练</h1>
          <p className="text-purple-100 mb-6">AI 个性化训练，让您的爱宠更聪明</p>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm">训练时长</span>
              </div>
              <div className="text-2xl font-bold">{totalTrainingTime} 分钟</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5" />
                <span className="text-sm">连续训练</span>
              </div>
              <div className="text-2xl font-bold">{streakDays} 天</div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="px-4 py-3 max-w-md mx-auto flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-purple-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2 max-w-md mx-auto">
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
      </div>

      {/* Course List */}
      <div className="px-4 max-w-md mx-auto space-y-4">
        {loading && courses.length === 0 ? (
          renderSkeleton()
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="w-12 h-12" />}
            title="暂无训练课程"
            description="当前分类下没有训练课程，请尝试其他分类"
            actionText="刷新"
            onAction={handleRefresh}
          />
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden animate-fade-in"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                        {getDifficultyLabel(course.difficulty)}
                      </span>
                      {course.isPremium && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          会员
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-neutral-800 mb-1">{course.title}</h3>
                    <p className="text-neutral-500 text-sm mb-3">{course.description}</p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {course.progress > 0 && (
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

                <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.duration} 分钟
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {course.completedSteps}/{course.totalSteps} 步骤
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    +{course.rewardPoints} 积分
                  </div>
                </div>

                <button
                  onClick={() => handleStartCourse(course.id)}
                  disabled={course.isPremium}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    course.isPremium
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {course.isPremium ? (
                    <>
                      <Lock className="w-5 h-5" />
                      会员专享
                    </>
                  ) : course.progress > 0 ? (
                    <>
                      <Play className="w-5 h-5" />
                      继续训练
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      开始训练
                    </>
                  )}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
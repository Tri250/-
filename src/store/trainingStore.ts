import { create } from 'zustand';
import { TrainingCourse, TrainingSession, TrainingRecord, TrainingStore } from '../types/training';

const mockCourses: TrainingCourse[] = [
  {
    id: '1',
    title: '基础服从训练',
    description: '教会您的爱宠基本的服从命令，包括坐下、握手等',
    category: 'basic',
    difficulty: 'beginner',
    duration: 15,
    totalSteps: 5,
    completedSteps: 3,
    rewardPoints: 100,
    isPremium: false,
    progress: 60
  },
  {
    id: '2',
    title: '高级技能训练',
    description: '让您的宠物掌握更多炫酷的技能',
    category: 'trick',
    difficulty: 'intermediate',
    duration: 20,
    totalSteps: 8,
    completedSteps: 0,
    rewardPoints: 200,
    isPremium: false,
    progress: 0
  },
  {
    id: '3',
    title: '社交能力培养',
    description: '帮助您的宠物更好地与人类和其他动物互动',
    category: 'social',
    difficulty: 'intermediate',
    duration: 25,
    totalSteps: 6,
    completedSteps: 0,
    rewardPoints: 150,
    isPremium: true,
    progress: 0
  },
  {
    id: '4',
    title: '行为问题纠正',
    description: '针对常见行为问题的专业训练方案',
    category: 'behavior',
    difficulty: 'advanced',
    duration: 30,
    totalSteps: 10,
    completedSteps: 0,
    rewardPoints: 300,
    isPremium: true,
    progress: 0
  }
];

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  courses: mockCourses,
  currentSession: null,
  trainingRecords: [],
  totalTrainingTime: 120,
  streakDays: 5,

  setCourses: (courses) => set({ courses }),

  startSession: (courseId) => {
    const session: TrainingSession = {
      id: Date.now().toString(),
      courseId,
      startTime: new Date(),
      stepsCompleted: 0
    };
    set({ currentSession: session });
  },

  completeStep: (_stepId) => {
    // 简单实现，实际项目中会更新 step 状态
  },

  endSession: (notes) => {
    const { currentSession, totalTrainingTime } = get();
    if (!currentSession) return;

    const duration = Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000 / 60);
    
    const record: TrainingRecord = {
      id: Date.now().toString(),
      date: new Date(),
      courseId: currentSession.courseId,
      courseTitle: '训练课程',
      duration,
      success: duration >= 10,
      notes
    };

    set((state) => ({
      currentSession: null,
      trainingRecords: [record, ...state.trainingRecords],
      totalTrainingTime: totalTrainingTime + duration
    }));
  },

  addTrainingRecord: (record) => set((state) => ({
    trainingRecords: [record, ...state.trainingRecords]
  })),

  updateCourseProgress: (courseId, completedSteps) => set((state) => ({
    courses: state.courses.map(course => 
      course.id === courseId 
        ? { ...course, completedSteps, progress: Math.round((completedSteps / course.totalSteps) * 100) }
        : course
    )
  }))
}));

import { create } from 'zustand';
import { TrainingCourse, TrainingSession, TrainingRecord, TrainingStore } from '../types/training';
import { api } from '../lib/api';

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  courses: [],
  currentSession: null,
  trainingRecords: [],
  totalTrainingTime: 0,
  streakDays: 0,
  loading: false,
  error: null,

  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ courses: TrainingCourse[] }>('/training/programs');
      set({ courses: data.courses, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取训练课程失败', loading: false });
    }
  },

  fetchTrainingRecords: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ records: TrainingRecord[]; totalTime: number; streakDays: number }>('/training/records');
      set({ trainingRecords: data.records.map(r => ({ ...r, date: new Date(r.date) })), totalTrainingTime: data.totalTime, streakDays: data.streakDays, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取训练记录失败', loading: false });
    }
  },

  setCourses: (courses) => set({ courses }),

  startSession: (courseId) => {
    const session: TrainingSession = {
      id: Date.now().toString(),
      courseId,
      startTime: new Date(),
      stepsCompleted: 0,
    };
    set({ currentSession: session });
  },

  completeStep: async (_stepId) => {
    try {
      await api.post('/training/steps/complete', { stepId: _stepId });
    } catch {
      // silent fail
    }
  },

  endSession: async (notes) => {
    const { currentSession, totalTrainingTime } = get();
    if (!currentSession) return;

    const duration = Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000 / 60);

    try {
      const data = await api.post<{ record: TrainingRecord }>('/training/sessions/end', {
        courseId: currentSession.courseId,
        duration,
        notes,
      });
      const record = { ...data.record, date: new Date(data.record.date) };
      set((state) => ({
        currentSession: null,
        trainingRecords: [record, ...state.trainingRecords],
        totalTrainingTime: totalTrainingTime + duration,
      }));
    } catch {
      const record: TrainingRecord = {
        id: Date.now().toString(),
        date: new Date(),
        courseId: currentSession.courseId,
        courseTitle: '训练课程',
        duration,
        success: duration >= 10,
        notes,
      };

      set((state) => ({
        currentSession: null,
        trainingRecords: [record, ...state.trainingRecords],
        totalTrainingTime: totalTrainingTime + duration,
      }));
    }
  },

  addTrainingRecord: (record) => set((state) => ({
    trainingRecords: [record, ...state.trainingRecords],
  })),

  updateCourseProgress: (courseId, completedSteps) => set((state) => ({
    courses: state.courses.map(course =>
      course.id === courseId
        ? { ...course, completedSteps, progress: Math.round((completedSteps / course.totalSteps) * 100) }
        : course
    ),
  })),
}));
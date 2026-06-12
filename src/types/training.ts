export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'behavior' | 'trick' | 'social';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  totalSteps: number;
  completedSteps: number;
  thumbnail?: string;
  rewardPoints: number;
  isPremium: boolean;
  progress: number;
}

export interface TrainingStep {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  duration: number;
  tips: string[];
  isCompleted: boolean;
}

export interface TrainingSession {
  id: string;
  courseId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stepsCompleted: number;
  notes?: string;
}

export interface TrainingRecord {
  id: string;
  date: Date;
  courseId: string;
  courseTitle: string;
  duration: number;
  success: boolean;
  notes?: string;
}

export interface TrainingStore {
  courses: TrainingCourse[];
  currentSession: TrainingSession | null;
  trainingRecords: TrainingRecord[];
  totalTrainingTime: number;
  streakDays: number;
  
  setCourses: (courses: TrainingCourse[]) => void;
  startSession: (courseId: string) => void;
  completeStep: (stepId: string) => void;
  endSession: (notes?: string) => void;
  addTrainingRecord: (record: TrainingRecord) => void;
  updateCourseProgress: (courseId: string, completedSteps: number) => void;
  initialize: () => Promise<void>;
}

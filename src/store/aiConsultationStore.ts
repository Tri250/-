import { create } from 'zustand';
import { AIConsultation, AIMessage, TrendReport, QUICK_QUESTIONS } from '../types/ai-consultation';
import { aiConsultationService } from '../services/aiConsultationService';

interface AIConsultationStore {
  consultations: AIConsultation[];
  currentConsultationId: string | null;
  reports: TrendReport[];
  isTyping: boolean;
  quickQuestions: string[];
  
  // Actions
  createConsultation: (petId: string, type: AIConsultation['type'], title: string) => string;
  addMessage: (consultationId: string, message: Omit<AIMessage, 'id' | 'createdAt'>) => void;
  sendAIMessage: (consultationId: string, content: string, petType?: string) => Promise<void>;
  setCurrentConsultation: (id: string | null) => void;
  
  generateReport: (petId: string, period: '7d' | '30d' | '90d') => void;
  
  getCurrentMessages: () => AIMessage[];
}

export const useAIConsultationStore = create<AIConsultationStore>((set, get) => ({
  consultations: [],
  currentConsultationId: null,
  reports: [],
  isTyping: false,
  quickQuestions: QUICK_QUESTIONS,

  createConsultation: (petId, type, title) => {
    const id = Date.now().toString();
    const consultation: AIConsultation = {
      id,
      petId,
      type,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      consultations: [consultation, ...state.consultations],
      currentConsultationId: id,
    }));
    return id;
  },

  addMessage: (consultationId, message) => {
    const newMessage: AIMessage = {
      ...message,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      consultations: state.consultations.map((c) =>
        c.id === consultationId
          ? { ...c, messages: [...c.messages, newMessage], updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  },

  sendAIMessage: async (consultationId, content, petType) => {
    get().addMessage(consultationId, {
      role: 'user',
      content,
    });

    set({ isTyping: true });

    const aiResponse = await aiConsultationService.sendMessage(consultationId, content, petType);

    get().addMessage(consultationId, {
      role: aiResponse.role,
      content: aiResponse.content,
    });

    set({ isTyping: false });
  },

  setCurrentConsultation: (id) => set({ currentConsultationId: id }),

  generateReport: (petId, period) => {
    const report: TrendReport = {
      id: Date.now().toString(),
      petId,
      period,
      title: `${period}健康趋势报告`,
      summary: '整体健康状况良好，建议继续保持当前的护理方式。',
      keyFindings: [
        '体重稳定在理想范围内',
        '活动量适中，精力充沛',
        '饮食规律，食欲良好',
      ],
      recommendations: [
        '继续保持定期体检',
        '增加饮水量',
        '适当增加户外活动',
      ],
      healthScore: 85,
      chartsData: {},
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reports: [report, ...state.reports],
    }));
  },

  getCurrentMessages: () => {
    const state = get();
    const consultation = state.consultations.find((c) => c.id === state.currentConsultationId);
    return consultation?.messages || [];
  },
}));

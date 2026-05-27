import { create } from 'zustand';
import { AIConsultation, AIMessage, TrendReport, HealthReport } from '../types/ai-consultation';
import { aiConsultationService } from '../services/aiConsultationService';

interface AIConsultationStore {
  consultations: AIConsultation[];
  currentConsultationId: string | null;
  reports: TrendReport[];
  healthReports: HealthReport[];
  isTyping: boolean;
  quickQuestions: string[];
  
  createConsultation: (petId: string, type: AIConsultation['type'], title: string) => string;
  addMessage: (consultationId: string, message: Omit<AIMessage, 'id' | 'createdAt'>) => void;
  sendAIMessage: (consultationId: string, content: string, petId?: string) => Promise<void>;
  setCurrentConsultation: (id: string | null) => void;
  
  generateReport: (petId: string, period: '7d' | '30d' | '90d') => void;
  generateHealthReport: (petId: string, petName: string, period: string, healthData?: any) => void;
  
  getCurrentMessages: () => AIMessage[];
  getConsultationsByPet: (petId: string) => AIConsultation[];
  clearPetHistory: (petId: string) => void;
  getTrendReport: (petId: string, period: string) => any;
}

export const useAIConsultationStore = create<AIConsultationStore>((set, get) => ({
  consultations: [],
  currentConsultationId: null,
  reports: [],
  healthReports: [],
  isTyping: false,
  quickQuestions: [
    '我家宠物食欲不振怎么办？',
    '狗狗最近掉毛严重正常吗？',
    '猫咪多久驱虫一次？',
    '如何给宠物减肥？',
  ],

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

  sendAIMessage: async (consultationId, content, petId) => {
    const state = get();
    const consultation = state.consultations.find((c) => c.id === consultationId);
    const petType = petId === '1' ? 'cat' : 'dog';
    const consultationHistory = consultation?.messages || [];

    get().addMessage(consultationId, {
      role: 'user',
      content,
    });

    set({ isTyping: true });

    try {
      const aiResponse = await aiConsultationService.sendMessage(
        consultationId, 
        content, 
        petType,
        consultationHistory
      );
      
      get().addMessage(consultationId, {
        role: 'assistant',
        content: aiResponse.content,
      });
    } catch (error) {
      console.error('AI response error:', error);
      get().addMessage(consultationId, {
        role: 'assistant',
        content: '抱歉，我暂时无法回答您的问题，请稍后再试。如有紧急情况，请及时联系宠物医院。',
      });
    }

    set({ isTyping: false });
  },

  setCurrentConsultation: (id) => set({ currentConsultationId: id }),

  generateReport: (petId, period) => {
    const report = aiConsultationService.generateTrendReport(petId, period);
    set((state) => ({
      reports: [report, ...state.reports],
    }));
  },

  generateHealthReport: (petId, petName, period, healthData = {}) => {
    const report = aiConsultationService.generateHealthReport(petId, petName, period, healthData);
    set((state) => ({
      healthReports: [report, ...state.healthReports],
    }));
  },

  getCurrentMessages: () => {
    const state = get();
    const consultation = state.consultations.find((c) => c.id === state.currentConsultationId);
    return consultation?.messages || [];
  },

  getConsultationsByPet: (petId) => {
    const state = get();
    return state.consultations.filter((c) => c.petId === petId);
  },

  clearPetHistory: (petId) => {
    set((state) => ({
      consultations: state.consultations.filter((c) => c.petId !== petId),
    }));
  },

  getTrendReport: (petId: string, period: string) => {
    return aiConsultationService.generateTrendReport(petId, period as any);
  },
}));

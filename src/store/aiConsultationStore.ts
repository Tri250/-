import { create } from 'zustand';
import { AIConsultation, AIMessage, TrendReport, ConversationContext, ConversationHistory, QUICK_QUESTIONS, MessageAttachment } from '../types/ai-consultation';
import { aiConsultationService } from '../services/aiConsultationService';

interface AIConsultationStore {
  consultations: AIConsultation[];
  conversationHistories: ConversationHistory[];
  currentConsultationId: string | null;
  reports: TrendReport[];
  isTyping: boolean;
  quickQuestions: string[];
  
  createConsultation: (petId: string, type: AIConsultation['type'], title: string) => string;
  addMessage: (consultationId: string, message: Omit<AIMessage, 'id' | 'createdAt'>) => void;
  sendAIMessage: (consultationId: string, content: string, attachments?: MessageAttachment[]) => Promise<void>;
  setCurrentConsultation: (id: string | null) => void;
  updateContext: (consultationId: string, context: Partial<ConversationContext>) => void;
  
  loadConversationHistory: (petId: string) => ConversationHistory[];
  deleteConversation: (consultationId: string) => void;
  clearAllConversations: () => void;
  
  generateReport: (petId: string, period: '7d' | '30d' | '90d') => void;
  
  getCurrentMessages: () => AIMessage[];
  getCurrentContext: () => ConversationContext | null;
}

const initialContext: ConversationContext = {
  petInfo: {},
  discussedTopics: [],
  mentionedSymptoms: [],
  lastIntent: undefined,
};

export const useAIConsultationStore = create<AIConsultationStore>((set, get) => ({
  consultations: [],
  conversationHistories: [],
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
      context: { ...initialContext },
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
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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

  updateContext: (consultationId, contextUpdate) => {
    set((state) => ({
      consultations: state.consultations.map((c) =>
        c.id === consultationId
          ? { ...c, context: { ...c.context, ...contextUpdate } }
          : c
      ),
    }));
  },

  sendAIMessage: async (consultationId, content, attachments = []) => {
    const state = get();
    const consultation = state.consultations.find((c) => c.id === consultationId);
    
    if (!consultation) return;

    const userMessage: Omit<AIMessage, 'id' | 'createdAt'> = {
      role: 'user',
      content,
      messageType: attachments.length > 0 ? 'image' : 'text',
      attachments: attachments.length > 0 ? attachments : undefined,
      status: 'sent',
    };
    
    get().addMessage(consultationId, userMessage);

    set({ isTyping: true });

    try {
      const petType = consultation.context.petInfo?.type;
      const contextMessages = consultation.messages.slice(-10);
      
      const aiResponse = await aiConsultationService.sendMessageWithContext(
        content,
        contextMessages,
        consultation.context,
        petType
      );

      const contextUpdate = aiConsultationService.extractContextInfo(content, consultation.context);
      if (Object.keys(contextUpdate).length > 0) {
        get().updateContext(consultationId, contextUpdate);
      }

      get().addMessage(consultationId, {
        role: 'assistant',
        content: aiResponse.content,
        messageType: 'text',
        status: 'sent',
      });
    } catch (error) {
      get().addMessage(consultationId, {
        role: 'system',
        content: '抱歉，消息发送失败，请稍后重试。',
        messageType: 'system',
        status: 'error',
      });
    } finally {
      set({ isTyping: false });
    }
  },

  setCurrentConsultation: (id) => set({ currentConsultationId: id }),

  loadConversationHistory: (petId) => {
    const state = get();
    const histories: ConversationHistory[] = state.consultations
      .filter((c) => c.petId === petId)
      .map((c) => ({
        id: c.id,
        petId: c.petId,
        title: c.title,
        lastMessage: c.messages[c.messages.length - 1]?.content || '暂无消息',
        messageCount: c.messages.length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    
    set({ conversationHistories: histories });
    return histories;
  },

  deleteConversation: (consultationId) => {
    set((state) => ({
      consultations: state.consultations.filter((c) => c.id !== consultationId),
      currentConsultationId: state.currentConsultationId === consultationId 
        ? null 
        : state.currentConsultationId,
    }));
  },

  clearAllConversations: () => {
    set({
      consultations: [],
      currentConsultationId: null,
      conversationHistories: [],
    });
  },

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

  getCurrentContext: () => {
    const state = get();
    const consultation = state.consultations.find((c) => c.id === state.currentConsultationId);
    return consultation?.context || null;
  },
}));
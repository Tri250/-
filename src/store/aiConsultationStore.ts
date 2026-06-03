import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  createdAt?: string;
  attachments?: Array<{ id: string; type: string; url: string; name: string }>;
}

interface Consultation {
  id: string;
  petId: string;
  petName: string;
  type: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ConversationHistory {
  id: string;
  petId: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  updatedAt?: string;
  messageCount: number;
}

interface AIConsultationState {
  consultations: Consultation[];
  currentConsultation: Consultation | null;
  currentConsultationId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  conversationHistories: ConversationHistory[];

  createConsultation: (petId: string, type: string, title: string) => string | null;
  setCurrentConsultation: (consultation: Consultation | string | null) => void;
  addMessage: (consultationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  sendAIMessage: (consultationId: string, content: string, attachments?: any) => void;
  getCurrentMessages: () => AIMessage[];
  loadConversationHistory: (petId: string) => void;
  deleteConversation: (consultationId: string) => void;
  clearConsultation: (consultationId: string) => void;
  deleteConsultation: (consultationId: string) => void;
  getConsultationsByPet: (petId: string) => Consultation[];
}

const storage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useAIConsultationStore = create<AIConsultationState>()(
  persist(
    (set, get) => ({
      consultations: [],
      currentConsultation: null,
      currentConsultationId: null,
      isLoading: false,
      isTyping: false,
      error: null,
      conversationHistories: [],

      createConsultation: (petId, type, title) => {
        const newConsultation: Consultation = {
          id: `consultation-${Date.now()}`,
          petId,
          petName: title,
          type,
          title,
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: `你好！我是PawSync的AI健康顾问。请问您想咨询关于${title}的什么问题？`,
              timestamp: Date.now(),
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          consultations: [newConsultation, ...state.consultations],
          currentConsultation: newConsultation,
          currentConsultationId: newConsultation.id,
        }));

        return newConsultation.id;
      },

      setCurrentConsultation: (consultation) => {
        if (typeof consultation === 'string') {
          const found = get().consultations.find(c => c.id === consultation);
          set({ 
            currentConsultation: found || null,
            currentConsultationId: consultation
          });
        } else {
          set({ 
            currentConsultation: consultation,
            currentConsultationId: consultation?.id || null 
          });
        }
      },

      addMessage: (consultationId, message) => {
        const now = Date.now();
        const newMessage: AIMessage = {
          id: `msg-${now}`,
          ...message,
          timestamp: now,
          createdAt: new Date(now).toISOString(),
        };

        set((state) => ({
          consultations: state.consultations.map((c) =>
            c.id === consultationId
              ? {
                  ...c,
                  messages: [...c.messages, newMessage],
                  updatedAt: Date.now(),
                }
              : c
          ),
          currentConsultation:
            state.currentConsultation?.id === consultationId
              ? {
                  ...state.currentConsultation,
                  messages: [...state.currentConsultation.messages, newMessage],
                  updatedAt: Date.now(),
                }
              : state.currentConsultation,
        }));
      },

      sendAIMessage: (consultationId, content, _attachments?) => {
        // Add user message
        get().addMessage(consultationId, { role: 'user', content });
        
        // Simulate AI response
        set({ isTyping: true });
        
        setTimeout(() => {
          const responses = [
            '我理解您的 concern。建议您观察宠物的饮食和排便情况，如有异常请及时就医。',
            '这是一个很好的问题。根据您描述的情况，建议保持观察，并记录宠物的行为变化。',
            '感谢您的咨询。建议您定期为宠物进行体检，以确保它的健康状况。',
            '我了解了。建议您注意宠物的日常护理，保持环境清洁，提供均衡的饮食。',
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          get().addMessage(consultationId, { role: 'assistant', content: randomResponse });
          set({ isTyping: false });
        }, 1500);
      },

      getCurrentMessages: () => {
        const { currentConsultation } = get();
        return currentConsultation?.messages || [];
      },

      loadConversationHistory: (petId) => {
        const { consultations } = get();
        const petConsultations = consultations.filter(c => c.petId === petId);
        
        const histories: ConversationHistory[] = petConsultations.map(c => ({
          id: c.id,
          petId: c.petId,
          title: c.title,
          lastMessage: c.messages[c.messages.length - 1]?.content || '',
          timestamp: c.updatedAt,
          updatedAt: new Date(c.updatedAt).toISOString(),
          messageCount: c.messages.length,
        }));
        
        set({ conversationHistories: histories });
      },

      deleteConversation: (consultationId) => {
        set((state) => ({
          consultations: state.consultations.filter((c) => c.id !== consultationId),
          conversationHistories: state.conversationHistories.filter((h) => h.id !== consultationId),
          currentConsultation:
            state.currentConsultation?.id === consultationId
              ? null
              : state.currentConsultation,
          currentConsultationId:
            state.currentConsultationId === consultationId
              ? null
              : state.currentConsultationId,
        }));
      },

      clearConsultation: (consultationId) => {
        set((state) => ({
          consultations: state.consultations.map((c) =>
            c.id === consultationId
              ? {
                  ...c,
                  messages: [
                    {
                      id: `msg-${Date.now()}`,
                      role: 'assistant',
                      content: '对话已清除。请问还有什么需要帮助的吗？',
                      timestamp: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : c
          ),
          currentConsultation:
            state.currentConsultation?.id === consultationId
              ? {
                  ...state.currentConsultation,
                  messages: [
                    {
                      id: `msg-${Date.now()}`,
                      role: 'assistant',
                      content: '对话已清除。请问还有什么需要帮助的吗？',
                      timestamp: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : state.currentConsultation,
        }));
      },

      deleteConsultation: (consultationId) => {
        set((state) => ({
          consultations: state.consultations.filter((c) => c.id !== consultationId),
          currentConsultation:
            state.currentConsultation?.id === consultationId
              ? null
              : state.currentConsultation,
          currentConsultationId:
            state.currentConsultationId === consultationId
              ? null
              : state.currentConsultationId,
        }));
      },

      getConsultationsByPet: (petId) => {
        return get().consultations.filter((c) => c.petId === petId);
      },
    }),
    {
      name: 'ai-consultation-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

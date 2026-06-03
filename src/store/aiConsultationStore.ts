import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Consultation {
  id: string;
  petId: string;
  petName: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AIConsultationState {
  consultations: Consultation[];
  currentConsultation: Consultation | null;
  isLoading: boolean;
  error: string | null;

  createConsultation: (petId: string, petName: string) => void;
  setCurrentConsultation: (consultation: Consultation | null) => void;
  addMessage: (consultationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
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
      isLoading: false,
      error: null,

      createConsultation: (petId, petName) => {
        const newConsultation: Consultation = {
          id: `consultation-${Date.now()}`,
          petId,
          petName,
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: `你好！我是PawSync的AI健康顾问。请问您想咨询关于${petName}的什么问题？`,
              timestamp: Date.now(),
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          consultations: [newConsultation, ...state.consultations],
          currentConsultation: newConsultation,
        }));
      },

      setCurrentConsultation: (consultation) => {
        set({ currentConsultation: consultation });
      },

      addMessage: (consultationId, message) => {
        const newMessage: AIMessage = {
          id: `msg-${Date.now()}`,
          ...message,
          timestamp: Date.now(),
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

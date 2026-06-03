import { create } from 'zustand';
import { AIConsultation, AIMessage, TrendReport, ConversationContext, ConversationHistory, QUICK_QUESTIONS, MessageAttachment } from '../types/ai-consultation';
import { aiConsultationService } from '../services/aiConsultationService';
import { secureStorage } from '../utils/security';

const STORAGE_KEY_PREFIX = 'ai_memory_';
const SHORT_TERM_ROUNDS = 5;
const LONG_TERM_EXPIRY_DAYS = 30;
const _MEMORY_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

interface ShortTermContext {
  roundNumber: number;
  keyInformation: string[];
  referencedTopics: string[];
  lastUserIntent: string | null;
  conversationFlow: Array<{ role: string; summary: string; timestamp: string }>;
}

interface LongTermMemory {
  id: string;
  userId: string;
  petId: string;
  topic: string;
  content: string;
  importance: number;
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
  expiresAt: string;
}

interface AIConsultationStore {
  consultations: AIConsultation[];
  conversationHistories: ConversationHistory[];
  currentConsultationId: string | null;
  reports: TrendReport[];
  isTyping: boolean;
  quickQuestions: string[];
  shortTermContexts: Map<string, ShortTermContext>;
  longTermMemories: LongTermMemory[];
  currentUserId: string | null;
  
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
  
  setUserId: (userId: string) => void;
  getRecentRoundsContext: (consultationId: string, rounds?: number) => AIMessage[];
  recallLongTermMemory: (topic: string, petId?: string) => LongTermMemory[];
  storeLongTermMemory: (memory: Omit<LongTermMemory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>) => void;
  deleteMemory: (memoryId: string) => void;
  clearUserMemories: () => void;
  cleanupExpiredMemories: () => void;
  getShortTermContext: (consultationId: string) => ShortTermContext | null;
  referenceHistoryInfo: (consultationId: string, infoKey: string) => string | null;
}

const initialContext: ConversationContext = {
  petInfo: {},
  discussedTopics: [],
  mentionedSymptoms: [],
  lastIntent: undefined,
};

const createInitialShortTermContext = (): ShortTermContext => ({
  roundNumber: 0,
  keyInformation: [],
  referencedTopics: [],
  lastUserIntent: null,
  conversationFlow: [],
});

const loadLongTermMemoriesFromStorage = (userId: string): LongTermMemory[] => {
  try {
    const stored = secureStorage.get<LongTermMemory[]>(`${STORAGE_KEY_PREFIX}${userId}_longterm`, false);
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const saveLongTermMemoriesToStorage = (userId: string, memories: LongTermMemory[]): void => {
  try {
    secureStorage.set(`${STORAGE_KEY_PREFIX}${userId}_longterm`, memories, false);
  } catch (error) {
    console.error('Failed to save long-term memories:', error);
  }
};

const extractKeyInfoFromMessage = (message: AIMessage): string[] => {
  const keyInfo: string[] = [];
  const content = message.content.toLowerCase();
  
  const symptomKeywords = ['食欲不振', '呕吐', '腹泻', '咳嗽', '发烧', '脱毛', '嗜睡', '瘙痒', '口臭'];
  symptomKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      keyInfo.push(`症状:${keyword}`);
    }
  });
  
  const intentKeywords = ['怎么治', '吃什么药', '怎么办', '为什么', '如何预防'];
  intentKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      keyInfo.push(`意图:${keyword}`);
    }
  });
  
  const petTypeMatch = content.match(/(猫|狗|猫咪|狗狗)/);
  if (petTypeMatch) {
    keyInfo.push(`宠物类型:${petTypeMatch[1]}`);
  }
  
  return keyInfo;
};

const summarizeMessage = (message: AIMessage): string => {
  const maxLen = 100;
  if (message.content.length <= maxLen) return message.content;
  return message.content.substring(0, maxLen) + '...';
};

export const useAIConsultationStore = create<AIConsultationStore>((set, get) => ({
  consultations: [],
  conversationHistories: [],
  currentConsultationId: null,
  reports: [],
  isTyping: false,
  quickQuestions: QUICK_QUESTIONS,
  shortTermContexts: new Map<string, ShortTermContext>(),
  longTermMemories: [],
  currentUserId: null,

  setUserId: (userId) => {
    const memories = loadLongTermMemoriesFromStorage(userId);
    set({ currentUserId: userId, longTermMemories: memories });
    get().cleanupExpiredMemories();
  },

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
    const shortTermContext = createInitialShortTermContext();
    set((state) => {
      const newShortTermContexts = new Map(state.shortTermContexts);
      newShortTermContexts.set(id, shortTermContext);
      return {
        consultations: [consultation, ...state.consultations],
        currentConsultationId: id,
        shortTermContexts: newShortTermContexts,
      };
    });
    return id;
  },

  addMessage: (consultationId, message) => {
    const newMessage: AIMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const consultation = state.consultations.find(c => c.id === consultationId);
      const shortTermContext = state.shortTermContexts.get(consultationId);
      
      if (!consultation) return state;
      
      const newMessages = [...consultation.messages, newMessage];
      const userMessages = newMessages.filter(m => m.role === 'user');
      const newRoundNumber = userMessages.length;
      
      let newShortTermContexts = state.shortTermContexts;
      if (shortTermContext) {
        const keyInfo = extractKeyInfoFromMessage(newMessage);
        const summary = summarizeMessage(newMessage);
        const updatedContext: ShortTermContext = {
          roundNumber: newRoundNumber,
          keyInformation: [...shortTermContext.keyInformation, ...keyInfo].slice(-20),
          referencedTopics: shortTermContext.referencedTopics,
          lastUserIntent: message.role === 'user' ? newMessage.content.substring(0, 50) : shortTermContext.lastUserIntent,
          conversationFlow: [
            ...shortTermContext.conversationFlow.slice(-(SHORT_TERM_ROUNDS * 2 - 1)),
            { role: message.role, summary, timestamp: newMessage.createdAt }
          ].slice(-(SHORT_TERM_ROUNDS * 2)),
        };
        newShortTermContexts = new Map(state.shortTermContexts);
        newShortTermContexts.set(consultationId, updatedContext);
      }
      
      return {
        consultations: state.consultations.map((c) =>
          c.id === consultationId
            ? { ...c, messages: newMessages, updatedAt: new Date().toISOString() }
            : c
        ),
        shortTermContexts: newShortTermContexts,
      };
    });
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
    const shortTermContext = state.shortTermContexts.get(consultationId);
    
    if (!consultation) return;

    // 立即设置typing状态，确保UI显示加载指示器
    set({ isTyping: true });

    const userMessage: Omit<AIMessage, 'id' | 'createdAt'> = {
      role: 'user',
      content,
      messageType: attachments.length > 0 ? 'image' : 'text',
      attachments: attachments.length > 0 ? attachments : undefined,
      status: 'sent',
    };
    
    get().addMessage(consultationId, userMessage);

    try {
      const petType = consultation.context.petInfo?.type;
      const recentMessages = get().getRecentRoundsContext(consultationId, SHORT_TERM_ROUNDS);
      const relevantMemories = get().recallLongTermMemory(content, consultation.petId);
      
      let enhancedContext = { ...consultation.context };
      if (relevantMemories.length > 0) {
        const _memoryContext = relevantMemories.map(m => m.content).join('\n');
        enhancedContext = {
          ...enhancedContext,
          discussedTopics: [...enhancedContext.discussedTopics, ...relevantMemories.map(m => m.topic)],
        };
      }
      
      if (shortTermContext && shortTermContext.keyInformation.length > 0) {
        const recentKeyInfo = shortTermContext.keyInformation.slice(-10);
        const symptomsFromKeyInfo = recentKeyInfo
          .filter(info => info.startsWith('症状:'))
          .map(info => info.replace('症状:', ''));
        enhancedContext = {
          ...enhancedContext,
          mentionedSymptoms: [...new Set([...enhancedContext.mentionedSymptoms, ...symptomsFromKeyInfo])],
        };
      }
      
      const aiResponse = await aiConsultationService.sendMessageWithContext(
        content,
        recentMessages,
        enhancedContext,
        petType
      );

      const contextUpdate = aiConsultationService.extractContextInfo(content, consultation.context);
      if (Object.keys(contextUpdate).length > 0) {
        get().updateContext(consultationId, contextUpdate);
      }

      if (contextUpdate.mentionedSymptoms && contextUpdate.mentionedSymptoms.length > 0) {
        const userId = get().currentUserId;
        if (userId) {
          contextUpdate.mentionedSymptoms.forEach(symptom => {
            get().storeLongTermMemory({
              userId,
              petId: consultation.petId,
              topic: `症状记录:${symptom}`,
              content: `在对话中提到${symptom}症状，时间:${new Date().toISOString()}`,
              importance: 0.7,
              expiresAt: new Date(Date.now() + LONG_TERM_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
            });
          });
        }
      }

      get().addMessage(consultationId, {
        role: 'assistant',
        content: aiResponse.content,
        messageType: 'text',
        status: 'sent',
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      get().addMessage(consultationId, {
        role: 'system',
        content: '抱歉，消息发送失败，请稍后重试。',
        messageType: 'system',
        status: 'error',
      });
    } finally {
      // 确保在所有情况下都重置typing状态
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
    set((state) => {
      const newShortTermContexts = new Map(state.shortTermContexts);
      newShortTermContexts.delete(consultationId);
      return {
        consultations: state.consultations.filter((c) => c.id !== consultationId),
        currentConsultationId: state.currentConsultationId === consultationId 
          ? null 
          : state.currentConsultationId,
        shortTermContexts: newShortTermContexts,
      };
    });
  },

  clearAllConversations: () => {
    const userId = get().currentUserId;
    set({
      consultations: [],
      currentConsultationId: null,
      conversationHistories: [],
      shortTermContexts: new Map<string, ShortTermContext>(),
    });
    if (userId) {
      get().clearUserMemories();
    }
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

  getRecentRoundsContext: (consultationId, rounds = SHORT_TERM_ROUNDS) => {
    const state = get();
    const consultation = state.consultations.find(c => c.id === consultationId);
    if (!consultation) return [];
    const messagesPerRound = 2;
    const totalMessages = rounds * messagesPerRound;
    return consultation.messages.slice(-totalMessages);
  },

  recallLongTermMemory: (topic, petId) => {
    const state = get();
    const userId = state.currentUserId;
    if (!userId) return [];
    
    const memories = state.longTermMemories.filter(m => {
      if (m.userId !== userId) return false;
      if (petId && m.petId !== petId) return false;
      const isExpired = new Date(m.expiresAt) < new Date();
      if (isExpired) return false;
      const topicLower = topic.toLowerCase();
      const memoryTopicLower = m.topic.toLowerCase();
      const memoryContentLower = m.content.toLowerCase();
      return topicLower.includes(memoryTopicLower) || 
             memoryTopicLower.includes(topicLower) ||
             memoryContentLower.includes(topicLower);
    });
    
    if (memories.length > 0) {
      const updatedMemories = state.longTermMemories.map(m => {
        if (memories.includes(m)) {
          return {
            ...m,
            lastAccessedAt: new Date().toISOString(),
            accessCount: m.accessCount + 1,
          };
        }
        return m;
      });
      set({ longTermMemories: updatedMemories });
      saveLongTermMemoriesToStorage(userId, updatedMemories);
    }
    
    return memories.sort((a, b) => b.importance - a.importance).slice(0, 5);
  },

  storeLongTermMemory: (memory) => {
    const state = get();
    const userId = state.currentUserId || memory.userId;
    if (!userId) return;
    
    const newMemory: LongTermMemory = {
      ...memory,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      accessCount: 0,
    };
    
    const existingMemories = state.longTermMemories.filter(m => m.userId === userId);
    const duplicateIndex = existingMemories.findIndex(m => 
      m.topic === newMemory.topic && m.petId === newMemory.petId
    );
    
    let updatedMemories: LongTermMemory[];
    if (duplicateIndex >= 0) {
      updatedMemories = state.longTermMemories.map(m => 
        m.id === existingMemories[duplicateIndex].id 
          ? { ...m, content: newMemory.content, lastAccessedAt: newMemory.lastAccessedAt, accessCount: m.accessCount + 1 }
          : m
      );
    } else {
      updatedMemories = [...state.longTermMemories, newMemory];
    }
    
    set({ longTermMemories: updatedMemories });
    saveLongTermMemoriesToStorage(userId, updatedMemories.filter(m => m.userId === userId));
  },

  deleteMemory: (memoryId) => {
    const state = get();
    const userId = state.currentUserId;
    const updatedMemories = state.longTermMemories.filter(m => m.id !== memoryId);
    set({ longTermMemories: updatedMemories });
    if (userId) {
      saveLongTermMemoriesToStorage(userId, updatedMemories.filter(m => m.userId === userId));
    }
  },

  clearUserMemories: () => {
    const userId = get().currentUserId;
    if (!userId) return;
    
    const updatedMemories = get().longTermMemories.filter(m => m.userId !== userId);
    set({ longTermMemories: updatedMemories });
    
    try {
      secureStorage.remove(`${STORAGE_KEY_PREFIX}${userId}_longterm`);
    } catch (error) {
      console.error('Failed to clear user memories from storage:', error);
    }
  },

  cleanupExpiredMemories: () => {
    const state = get();
    const userId = state.currentUserId;
    const now = new Date();
    
    const activeMemories = state.longTermMemories.filter(m => {
      const expiresAt = new Date(m.expiresAt);
      return expiresAt > now;
    });
    
    if (activeMemories.length !== state.longTermMemories.length) {
      set({ longTermMemories: activeMemories });
      if (userId) {
        saveLongTermMemoriesToStorage(userId, activeMemories.filter(m => m.userId === userId));
      }
    }
  },

  getShortTermContext: (consultationId) => {
    const state = get();
    return state.shortTermContexts.get(consultationId) || null;
  },

  referenceHistoryInfo: (consultationId, infoKey) => {
    const state = get();
    const shortTermContext = state.shortTermContexts.get(consultationId);
    if (!shortTermContext) return null;
    
    const matchingInfo = shortTermContext.keyInformation.find(info => 
      info.toLowerCase().includes(infoKey.toLowerCase())
    );
    
    if (matchingInfo) {
      return matchingInfo;
    }
    
    const matchingFlow = shortTermContext.conversationFlow.find(flow => 
      flow.summary.toLowerCase().includes(infoKey.toLowerCase())
    );
    
    return matchingFlow ? matchingFlow.summary : null;
  },
}));
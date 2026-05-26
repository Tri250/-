import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '../../store/appStore';

describe('AppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State - 初始状态', () => {
    it('应该有默认的初始状态', () => {
      const store = useAppStore.getState();
      
      expect(store.isAuthenticated).toBe(true);
      expect(store.isOnboardingComplete).toBe(true);
      expect(store.pets).toHaveLength(1);
      expect(store.currentPet).not.toBeNull();
      expect(store.healthAlerts).toHaveLength(1);
      expect(store.careTips).toHaveLength(5);
    });

    it('初始宠物应该是小橘', () => {
      const store = useAppStore.getState();
      
      expect(store.currentPet?.name).toBe('小橘');
      expect(store.currentPet?.breed).toBe('橘猫');
      expect(store.currentPet?.type).toBe('cat');
    });
  });

  describe('setUser - 设置用户', () => {
    it('应该设置用户并更新认证状态', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        isPremium: false,
        createdAt: new Date().toISOString(),
      };
      
      useAppStore.getState().setUser(mockUser);
      const store = useAppStore.getState();
      
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
    });

    it('设置null用户应该取消认证', () => {
      useAppStore.getState().setUser(null);
      const store = useAppStore.getState();
      
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('login - 登录', () => {
    it('应该成功登录并设置用户', async () => {
      const result = await useAppStore.getState().login('test@example.com', 'password');
      
      expect(result).toBe(true);
      const store = useAppStore.getState();
      expect(store.user).not.toBeNull();
      expect(store.user?.email).toBe('test@example.com');
      expect(store.isAuthenticated).toBe(true);
    });
  });

  describe('register - 注册', () => {
    it('应该成功注册并设置用户', async () => {
      const result = await useAppStore.getState().register('new@example.com', 'password', 'newuser');
      
      expect(result).toBe(true);
      const store = useAppStore.getState();
      expect(store.user?.email).toBe('new@example.com');
      expect(store.user?.username).toBe('newuser');
      expect(store.isAuthenticated).toBe(true);
    });

    it('注册后应该未完成引导', async () => {
      await useAppStore.getState().register('test@example.com', 'password', 'testuser');
      const store = useAppStore.getState();
      
      expect(store.isOnboardingComplete).toBe(false);
    });
  });

  describe('logout - 登出', () => {
    it('应该成功登出并清除用户状态', () => {
      useAppStore.getState().logout();
      const store = useAppStore.getState();
      
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.isOnboardingComplete).toBe(false);
    });
  });

  describe('completeOnboarding - 完成引导', () => {
    it('应该设置引导完成状态', () => {
      useAppStore.getState().logout();
      const storeBefore = useAppStore.getState();
      expect(storeBefore.isOnboardingComplete).toBe(false);
      
      useAppStore.getState().completeOnboarding();
      const storeAfter = useAppStore.getState();
      expect(storeAfter.isOnboardingComplete).toBe(true);
    });
  });

  describe('setCurrentPet - 设置当前宠物', () => {
    it('应该设置当前宠物', () => {
      const newPet = {
        id: 'pet-2',
        name: '小黑',
        breed: '黑猫',
        age: 3,
        avatarUrl: '',
        type: 'cat',
      };
      
      useAppStore.getState().setCurrentPet(newPet);
      const store = useAppStore.getState();
      
      expect(store.currentPet?.id).toBe('pet-2');
      expect(store.currentPet?.name).toBe('小黑');
    });
  });

  describe('addPet - 添加宠物', () => {
    it('应该添加新宠物到列表', () => {
      const initialCount = useAppStore.getState().pets.length;
      
      useAppStore.getState().addPet({
        name: '旺财',
        breed: '金毛',
        age: 1,
        avatarUrl: '',
        type: 'dog',
      });
      
      const store = useAppStore.getState();
      expect(store.pets.length).toBe(initialCount + 1);
      expect(store.pets.find(p => p.name === '旺财')).not.toBeUndefined();
    });

    it('新添加的宠物应该有自动生成的ID', () => {
      useAppStore.getState().addPet({
        name: '球球',
        breed: '泰迪',
        age: 2,
        avatarUrl: '',
        type: 'dog',
      });
      
      const store = useAppStore.getState();
      const newPet = store.pets.find(p => p.name === '球球');
      expect(newPet?.id).toBeDefined();
    });
  });

  describe('addAnalysis - 添加分析记录', () => {
    it('应该添加新的分析记录', () => {
      const initialCount = useAppStore.getState().analyses.length;
      
      useAppStore.getState().addAnalysis({
        petId: '1',
        type: 'voice',
        result: {
          emotion: 'happy',
          translation: '测试翻译',
          confidence: 90,
        },
      });
      
      const store = useAppStore.getState();
      expect(store.analyses.length).toBe(initialCount + 1);
    });

    it('分析记录应该有自动生成的ID和创建时间', () => {
      useAppStore.getState().addAnalysis({
        petId: '1',
        type: 'image',
        result: {
          emotion: 'happy',
          translation: '图片分析',
          confidence: 85,
        },
      });
      
      const store = useAppStore.getState();
      const latestAnalysis = store.analyses[store.analyses.length - 1];
      
      expect(latestAnalysis.id).toBeDefined();
      expect(latestAnalysis.createdAt).toBeDefined();
    });
  });

  describe('addHealthAlert - 添加健康提醒', () => {
    it('应该添加新的健康提醒', () => {
      const initialCount = useAppStore.getState().healthAlerts.length;
      
      useAppStore.getState().addHealthAlert({
        petId: '1',
        type: 'cough',
        severity: 'medium',
        message: '检测到咳嗽',
        timestamp: new Date().toISOString(),
      });
      
      const store = useAppStore.getState();
      expect(store.healthAlerts.length).toBe(initialCount + 1);
    });
  });

  describe('setIsRecording - 设置录制状态', () => {
    it('应该设置录制状态为true', () => {
      useAppStore.getState().setIsRecording(true);
      const store = useAppStore.getState();
      expect(store.isRecording).toBe(true);
    });

    it('应该设置录制状态为false', () => {
      useAppStore.getState().setIsRecording(false);
      const store = useAppStore.getState();
      expect(store.isRecording).toBe(false);
    });
  });

  describe('setCurrentEmotion - 设置当前情感', () => {
    it('应该设置当前情感', () => {
      useAppStore.getState().setCurrentEmotion('anxious');
      const store = useAppStore.getState();
      expect(store.currentEmotion).toBe('anxious');
    });

    it('应该接受所有有效的情感类型', () => {
      const emotions: ('happy' | 'anxious' | 'angry' | 'needs' | 'neutral')[] = ['happy', 'anxious', 'angry', 'needs', 'neutral'];
      
      emotions.forEach(emotion => {
        useAppStore.getState().setCurrentEmotion(emotion);
        expect(useAppStore.getState().currentEmotion).toBe(emotion);
      });
    });
  });

  describe('setHealthScore - 设置健康评分', () => {
    it('应该设置健康评分', () => {
      useAppStore.getState().setHealthScore(85);
      const store = useAppStore.getState();
      expect(store.healthScore).toBe(85);
    });

    it('应该接受有效的评分值', () => {
      useAppStore.getState().setHealthScore(0);
      expect(useAppStore.getState().healthScore).toBe(0);
      
      useAppStore.getState().setHealthScore(100);
      expect(useAppStore.getState().healthScore).toBe(100);
    });
  });

  describe('careTips - 护理建议', () => {
    it('应该包含所有类别的建议', () => {
      const store = useAppStore.getState();
      
      const categories = store.careTips.map(tip => tip.category);
      expect(categories).toContain('feeding');
      expect(categories).toContain('exercise');
      expect(categories).toContain('grooming');
      expect(categories).toContain('health');
      expect(categories).toContain('behavior');
    });

    it('建议应该有正确的优先级', () => {
      const store = useAppStore.getState();
      
      store.careTips.forEach(tip => {
        expect(['high', 'medium', 'low']).toContain(tip.priority);
      });
    });
  });
});
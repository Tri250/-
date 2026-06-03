import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    it('应该有默认设置', () => {
      const store = useAppStore.getState();
      
      expect(store.settings.notifications).toBe(true);
      expect(store.settings.soundEnabled).toBe(true);
      expect(store.settings.darkMode).toBe(false);
      expect(store.settings.fontSize).toBe('medium');
      expect(store.settings.autoPlay).toBe(true);
      expect(store.settings.language).toBe('zh-CN');
    });

    it('应该有默认健康评分', () => {
      const store = useAppStore.getState();
      expect(store.healthScore).toBe(92);
    });

    it('应该有默认情感状态', () => {
      const store = useAppStore.getState();
      expect(store.currentEmotion).toBe('happy');
    });
  });

  describe('initializeApp - 初始化应用', () => {
    it('应该成功初始化应用', async () => {
      await useAppStore.getState().initializeApp();
      
      const store = useAppStore.getState();
      expect(store.isInitialized).toBe(true);
    });

    it('初始化后应该有进度消息', async () => {
      const store = useAppStore.getState();
      await store.initializeApp();
      
      const finalStore = useAppStore.getState();
      expect(finalStore.initProgress).toBe(100);
      expect(finalStore.initMessage).toBe('初始化完成');
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

    it('应该支持高级用户', () => {
      const premiumUser = {
        id: 'user-premium',
        email: 'premium@example.com',
        username: 'premiumuser',
        isPremium: true,
        createdAt: new Date().toISOString(),
      };
      
      useAppStore.getState().setUser(premiumUser);
      const store = useAppStore.getState();
      
      expect(store.user?.isPremium).toBe(true);
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

    it('登录应该更新进度消息', async () => {
      await useAppStore.getState().login('test2@example.com', 'password');
      
      const store = useAppStore.getState();
      expect(store.initProgress).toBe(100);
      expect(store.initMessage).toBe('登录成功');
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

    it('注册应该生成唯一用户ID', async () => {
      await useAppStore.getState().register('user1@example.com', 'password', 'user1');
      const store1 = useAppStore.getState();
      const id1 = store1.user?.id;
      
      await useAppStore.getState().register('user2@example.com', 'password', 'user2');
      const store2 = useAppStore.getState();
      const id2 = store2.user?.id;
      
      expect(id1).not.toBe(id2);
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

    it('登出应该清除宠物数据', () => {
      useAppStore.getState().logout();
      const store = useAppStore.getState();
      
      expect(store.pets).toEqual([]);
      expect(store.currentPet).toBeNull();
    });

    it('登出应该清除分析数据', () => {
      useAppStore.getState().logout();
      const store = useAppStore.getState();
      
      expect(store.analyses).toEqual([]);
      expect(store.healthAlerts).toEqual([]);
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
        type: 'cat' as const,
      };
      
      useAppStore.getState().setCurrentPet(newPet);
      const store = useAppStore.getState();
      
      expect(store.currentPet?.id).toBe('pet-2');
      expect(store.currentPet?.name).toBe('小黑');
    });

    it('应该支持不同类型的宠物', () => {
      const dogPet = {
        id: 'pet-3',
        name: '旺财',
        breed: '金毛',
        age: 2,
        avatarUrl: '',
        type: 'dog' as const,
      };
      
      useAppStore.getState().setCurrentPet(dogPet);
      const store = useAppStore.getState();
      
      expect(store.currentPet?.type).toBe('dog');
    });
  });

  describe('updateCurrentPet - 更新当前宠物', () => {
    it('应该更新当前宠物的属性', () => {
      useAppStore.getState().updateCurrentPet({ name: '新名字' });
      const store = useAppStore.getState();
      
      expect(store.currentPet?.name).toBe('新名字');
    });

    it('应该更新当前宠物的年龄', () => {
      useAppStore.getState().updateCurrentPet({ age: 5 });
      const store = useAppStore.getState();
      
      expect(store.currentPet?.age).toBe(5);
    });

    it('应该支持更新多个属性', () => {
      useAppStore.getState().updateCurrentPet({
        name: '更新的名字',
        age: 4,
        breed: '新品种',
      });
      const store = useAppStore.getState();
      
      expect(store.currentPet?.name).toBe('更新的名字');
      expect(store.currentPet?.age).toBe(4);
      expect(store.currentPet?.breed).toBe('新品种');
    });

    it('没有当前宠物时应该不更新', () => {
      useAppStore.getState().logout();
      const _stateBefore = useAppStore.getState();
      
      useAppStore.getState().updateCurrentPet({ name: '测试' });
      const stateAfter = useAppStore.getState();
      
      expect(stateAfter.currentPet).toBeNull();
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
        type: 'dog' as const,
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
        type: 'dog' as const,
      });
      
      const store = useAppStore.getState();
      const newPet = store.pets.find(p => p.name === '球球');
      expect(newPet?.id).toBeDefined();
    });

    it('应该支持添加多个宠物', () => {
      const initialCount = useAppStore.getState().pets.length;
      
      useAppStore.getState().addPet({
        name: '宠物1',
        breed: '品种1',
        age: 1,
        avatarUrl: '',
        type: 'cat' as const,
      });
      
      useAppStore.getState().addPet({
        name: '宠物2',
        breed: '品种2',
        age: 2,
        avatarUrl: '',
        type: 'dog' as const,
      });
      
      const store = useAppStore.getState();
      expect(store.pets.length).toBe(initialCount + 2);
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

    it('应该支持不同的分析类型', () => {
      useAppStore.getState().addAnalysis({
        petId: '1',
        type: 'voice',
        result: {
          emotion: 'anxious',
          translation: '语音分析',
          confidence: 88,
        },
      });
      
      useAppStore.getState().addAnalysis({
        petId: '1',
        type: 'image',
        result: {
          emotion: 'calm',
          translation: '图像分析',
          confidence: 92,
        },
      });
      
      const store = useAppStore.getState();
      expect(store.analyses.length).toBeGreaterThanOrEqual(2);
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

    it('提醒应该有自动生成的ID', () => {
      useAppStore.getState().addHealthAlert({
        petId: '1',
        type: 'vomit',
        severity: 'high',
        message: '检测到呕吐',
        timestamp: new Date().toISOString(),
      });
      
      const store = useAppStore.getState();
      const latestAlert = store.healthAlerts[store.healthAlerts.length - 1];
      
      expect(latestAlert.id).toBeDefined();
    });

    it('应该支持不同的严重程度', () => {
      const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
      
      severities.forEach(severity => {
        useAppStore.getState().addHealthAlert({
          petId: '1',
          type: 'abnormal',
          severity,
          message: `测试提醒 ${severity}`,
          timestamp: new Date().toISOString(),
        });
      });
      
      const store = useAppStore.getState();
      expect(store.healthAlerts.length).toBeGreaterThanOrEqual(3);
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

    it('应该支持状态切换', () => {
      useAppStore.getState().setIsRecording(false);
      expect(useAppStore.getState().isRecording).toBe(false);
      
      useAppStore.getState().setIsRecording(true);
      expect(useAppStore.getState().isRecording).toBe(true);
      
      useAppStore.getState().setIsRecording(false);
      expect(useAppStore.getState().isRecording).toBe(false);
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
      
      useAppStore.getState().setHealthScore(50);
      expect(useAppStore.getState().healthScore).toBe(50);
    });
  });

  describe('updateSettings - 更新设置', () => {
    it('应该更新单个设置', () => {
      useAppStore.getState().updateSettings({ darkMode: true });
      const store = useAppStore.getState();
      
      expect(store.settings.darkMode).toBe(true);
    });

    it('应该更新多个设置', () => {
      useAppStore.getState().updateSettings({
        notifications: false,
        soundEnabled: false,
        fontSize: 'large',
      });
      const store = useAppStore.getState();
      
      expect(store.settings.notifications).toBe(false);
      expect(store.settings.soundEnabled).toBe(false);
      expect(store.settings.fontSize).toBe('large');
    });

    it('应该保留未更新的设置', () => {
      const beforeStore = useAppStore.getState();
      const beforeLanguage = beforeStore.settings.language;
      
      useAppStore.getState().updateSettings({ darkMode: true });
      const store = useAppStore.getState();
      
      expect(store.settings.language).toBe(beforeLanguage);
    });

    it('应该支持语言切换', () => {
      useAppStore.getState().updateSettings({ language: 'en-US' });
      const store = useAppStore.getState();
      
      expect(store.settings.language).toBe('en-US');
    });

    it('应该支持字体大小设置', () => {
      const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
      
      sizes.forEach(size => {
        useAppStore.getState().updateSettings({ fontSize: size });
        expect(useAppStore.getState().settings.fontSize).toBe(size);
      });
    });
  });

  describe('clearAllData - 清除所有数据', () => {
    it('应该清除所有数据', () => {
      useAppStore.getState().clearAllData();
      const store = useAppStore.getState();
      
      expect(store.analyses).toEqual([]);
      expect(store.healthAlerts).toEqual([]);
      expect(store.pets).toEqual([]);
      expect(store.currentPet).toBeNull();
    });

    it('不应该清除用户数据', () => {
      // 获取清除前的用户数据
      const userBefore = useAppStore.getState().user;
      
      useAppStore.getState().clearAllData();
      const store = useAppStore.getState();
      
      // clearAllData 只清除宠物、分析和提醒数据，不清除用户
      // 但根据实现，如果用户存在，isAuthenticated 应该保持 true
      if (userBefore) {
        expect(store.user).toEqual(userBefore);
      }
    });

    it('不应该清除设置', () => {
      const settings = useAppStore.getState().settings;
      useAppStore.getState().clearAllData();
      const store = useAppStore.getState();
      
      expect(store.settings).toEqual(settings);
    });
  });

  describe('setInitProgress - 设置初始化进度', () => {
    it('应该设置初始化进度和消息', () => {
      useAppStore.getState().setInitProgress(50, '加载中...');
      const store = useAppStore.getState();
      
      expect(store.initProgress).toBe(50);
      expect(store.initMessage).toBe('加载中...');
    });

    it('应该支持不同的进度值', () => {
      const progressValues = [0, 25, 50, 75, 100];
      
      progressValues.forEach(progress => {
        useAppStore.getState().setInitProgress(progress, `进度 ${progress}`);
        expect(useAppStore.getState().initProgress).toBe(progress);
      });
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

    it('建议应该包含正确的属性', () => {
      const store = useAppStore.getState();
      
      store.careTips.forEach(tip => {
        expect(tip).toHaveProperty('id');
        expect(tip).toHaveProperty('category');
        expect(tip).toHaveProperty('title');
        expect(tip).toHaveProperty('content');
        expect(tip).toHaveProperty('priority');
      });
    });
  });
});

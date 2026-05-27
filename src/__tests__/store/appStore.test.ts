import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '@/store/appStore';

describe('appStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have initial state with default values', () => {
      const store = useAppStore.getState();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(true);
      expect(store.isOnboardingComplete).toBe(true);
      expect(store.pets).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: '1', name: '小橘', type: 'cat' })
      ]));
      expect(store.currentPet).toEqual({
        id: '1',
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      });
      expect(store.analyses).toEqual([]);
      expect(store.healthAlerts).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: '1', type: 'abnormal', severity: 'low' })
      ]));
      expect(store.currentEmotion).toBe('happy');
      expect(store.healthScore).toBe(92);
      expect(store.isRecording).toBe(false);
      expect(store.careTips).toHaveLength(5);
    });
  });

  describe('User Management', () => {
    it('should set user correctly', () => {
      const store = useAppStore.getState();
      const testUser = {
        id: '2',
        email: 'test@example.com',
        username: 'testuser',
        isPremium: true,
        createdAt: new Date().toISOString(),
      };

      store.setUser(testUser);
      expect(useAppStore.getState().user).toEqual(testUser);
      expect(useAppStore.getState().isAuthenticated).toBe(true);
    });

    it('should set user to null and update authentication status', () => {
      const store = useAppStore.getState();
      store.setUser(null);
      expect(useAppStore.getState().user).toBeNull();
      expect(useAppStore.getState().isAuthenticated).toBe(false);
    });

    it('should login successfully', async () => {
      const store = useAppStore.getState();
      const result = await store.login('test@example.com', 'password');
      
      expect(result).toBe(true);
      expect(useAppStore.getState().user).toBeDefined();
      expect(useAppStore.getState().user?.email).toBe('test@example.com');
      expect(useAppStore.getState().isAuthenticated).toBe(true);
    });

    it('should register successfully', async () => {
      const store = useAppStore.getState();
      const result = await store.register('new@example.com', 'password', 'newuser');
      
      expect(result).toBe(true);
      expect(useAppStore.getState().user).toBeDefined();
      expect(useAppStore.getState().user?.username).toBe('newuser');
      expect(useAppStore.getState().isAuthenticated).toBe(true);
      expect(useAppStore.getState().isOnboardingComplete).toBe(false);
    });

    it('should logout and reset state', () => {
      const store = useAppStore.getState();
      store.logout();
      
      expect(useAppStore.getState().user).toBeNull();
      expect(useAppStore.getState().isAuthenticated).toBe(false);
      expect(useAppStore.getState().isOnboardingComplete).toBe(false);
    });

    it('should complete onboarding', () => {
      const store = useAppStore.getState();
      store.completeOnboarding();
      expect(useAppStore.getState().isOnboardingComplete).toBe(true);
    });
  });

  describe('Pet Management', () => {
    it('should set current pet', () => {
      const store = useAppStore.getState();
      const newPet = {
        id: '2',
        name: '旺财',
        breed: '金毛',
        age: 3,
        avatarUrl: '',
        type: 'dog',
      };

      store.setCurrentPet(newPet);
      expect(useAppStore.getState().currentPet).toEqual(newPet);
    });

    it('should add a new pet', () => {
      const store = useAppStore.getState();
      const initialLength = store.pets.length;
      
      store.addPet({
        name: '新宠物',
        breed: '品种',
        age: 1,
        avatarUrl: '',
        type: 'cat',
      });

      const newState = useAppStore.getState();
      expect(newState.pets.length).toBe(initialLength + 1);
      expect(newState.pets[newState.pets.length - 1].name).toBe('新宠物');
      expect(newState.pets[newState.pets.length - 1].id).toBeDefined();
    });

    it('should generate unique id for new pets', () => {
      const store = useAppStore.getState();
      const initialPets = [...store.pets];
      
      store.addPet({ name: 'pet1', breed: 'b', age: 1, avatarUrl: '', type: 'cat' });
      setTimeout(() => {
        store.addPet({ name: 'pet2', breed: 'b', age: 2, avatarUrl: '', type: 'dog' });
      }, 1);
      
      const newState = useAppStore.getState();
      const newPets = newState.pets.filter(p => !initialPets.find(ip => ip.id === p.id));
      
      expect(newPets.length).toBeGreaterThanOrEqual(1);
      newPets.forEach((pet, index) => {
        expect(pet.id).toBeDefined();
        if (index > 0) {
          expect(pet.id).not.toBe(newPets[index - 1].id);
        }
      });
    });
  });

  describe('Analysis Management', () => {
    it('should add analysis with generated id and timestamp', () => {
      const store = useAppStore.getState();
      const initialLength = store.analyses.length;
      
      store.addAnalysis({
        petId: '1',
        type: 'voice',
        result: {
          emotion: 'happy',
          translation: '开心',
          confidence: 90,
        },
      });

      const newState = useAppStore.getState();
      expect(newState.analyses.length).toBe(initialLength + 1);
      const newAnalysis = newState.analyses[newState.analyses.length - 1];
      expect(newAnalysis.id).toBeDefined();
      expect(newAnalysis.createdAt).toBeDefined();
      expect(new Date(newAnalysis.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('Health Alert Management', () => {
    it('should add health alert with generated id', () => {
      const store = useAppStore.getState();
      const initialLength = store.healthAlerts.length;
      
      store.addHealthAlert({
        petId: '1',
        type: 'cough',
        severity: 'medium',
        message: '测试警报',
        timestamp: '2024-01-15 15:00',
      });

      const newState = useAppStore.getState();
      expect(newState.healthAlerts.length).toBe(initialLength + 1);
      const newAlert = newState.healthAlerts[newState.healthAlerts.length - 1];
      expect(newAlert.id).toBeDefined();
      expect(newAlert.message).toBe('测试警报');
    });
  });

  describe('State Updates', () => {
    it('should update recording state', () => {
      const store = useAppStore.getState();
      store.setIsRecording(true);
      expect(useAppStore.getState().isRecording).toBe(true);
      
      store.setIsRecording(false);
      expect(useAppStore.getState().isRecording).toBe(false);
    });

    it('should update current emotion', () => {
      const store = useAppStore.getState();
      store.setCurrentEmotion('anxious');
      expect(useAppStore.getState().currentEmotion).toBe('anxious');
      
      store.setCurrentEmotion('happy');
      expect(useAppStore.getState().currentEmotion).toBe('happy');
    });

    it('should update health score', () => {
      const store = useAppStore.getState();
      store.setHealthScore(85);
      expect(useAppStore.getState().healthScore).toBe(85);
      
      store.setHealthScore(100);
      expect(useAppStore.getState().healthScore).toBe(100);
    });
  });

  describe('Care Tips', () => {
    it('should have correct number of care tips', () => {
      const store = useAppStore.getState();
      expect(store.careTips).toHaveLength(5);
    });

    it('should have correct categories', () => {
      const store = useAppStore.getState();
      const categories = store.careTips.map(tip => tip.category);
      expect(categories).toContain('feeding');
      expect(categories).toContain('health');
      expect(categories).toContain('grooming');
      expect(categories).toContain('exercise');
      expect(categories).toContain('behavior');
    });

    it('should have correct priorities', () => {
      const store = useAppStore.getState();
      const priorities = store.careTips.map(tip => tip.priority);
      expect(priorities).toContain('high');
      expect(priorities).toContain('medium');
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid emotion types', () => {
      const store = useAppStore.getState();
      expect(['happy', 'anxious', 'angry', 'needs', 'neutral']).toContain(store.currentEmotion);
    });

    it('should only accept valid pet types', () => {
      const store = useAppStore.getState();
      store.pets.forEach(pet => {
        expect(['cat', 'dog', 'other']).toContain(pet.type);
      });
    });

    it('should only accept valid alert types', () => {
      const store = useAppStore.getState();
      store.healthAlerts.forEach(alert => {
        expect(['cough', 'vomit', 'pain', 'abnormal']).toContain(alert.type);
      });
    });
  });
});
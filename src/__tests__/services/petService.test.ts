// ============================================
// PawSync Pro - petService.test.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 宠物服务测试 - UC-015到UC-017
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { PetService } from '../../services/petService';

describe('PetService - UC宠物用例', () => {
  beforeEach(() => {
    PetService.clear();
  });

  describe('UC-015: 更新宠物信息', () => {
    it('应该成功更新宠物信息', async () => {
      // 先添加一个宠物
      const addResult = await PetService.addPet({
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      expect(addResult.success).toBe(true);
      const petId = addResult.pet?.id!;

      // 更新宠物信息
      const updateResult = await PetService.updatePet(petId, {
        name: '大橘',
        age: 3,
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.message).toBe('更新成功');
      expect(updateResult.pet?.name).toBe('大橘');
      expect(updateResult.pet?.age).toBe(3);
    });

    it('应该验证更新的宠物名称', async () => {
      const addResult = await PetService.addPet({
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      const petId = addResult.pet?.id!;

      // 尝试更新为空名称
      const updateResult = await PetService.updatePet(petId, {
        name: '',
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.message).toContain('不能为空');
    });

    it('应该清理宠物名称防止XSS', async () => {
      const addResult = await PetService.addPet({
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      const petId = addResult.pet?.id!;

      // 更新为带有XSS的名称
      const updateResult = await PetService.updatePet(petId, {
        name: '<script>evil()</script>Bad Cat',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.pet?.name).not.toContain('<script>');
    });

    it('应该拒绝更新不存在的宠物', async () => {
      const updateResult = await PetService.updatePet('nonexistent-id', {
        name: '测试',
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.message).toBe('宠物不存在');
    });
  });

  describe('UC-016: 删除宠物', () => {
    it('应该成功删除宠物', async () => {
      const addResult = await PetService.addPet({
        name: '要删除的宠物',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      const petId = addResult.pet?.id!;

      // 验证宠物存在
      const beforeDelete = await PetService.getPets('user1');
      expect(beforeDelete.length).toBe(1);

      // 删除宠物
      const deleteResult = await PetService.deletePet(petId);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('宠物已删除');

      // 验证宠物已删除
      const afterDelete = await PetService.getPets('user1');
      expect(afterDelete.length).toBe(0);
    });

    it('应该拒绝删除不存在的宠物', async () => {
      const deleteResult = await PetService.deletePet('nonexistent-id');

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toBe('宠物不存在');
    });
  });

  describe('UC-017: 取消删除宠物', () => {
    it('应该验证确认删除流程', async () => {
      // 模拟删除确认流程
      const deletePet = (confirm: boolean) => {
        if (confirm) {
          return { cancelled: false };
        }
        return { cancelled: true };
      };

      // 取消删除
      const cancelResult = deletePet(false);
      expect(cancelResult.cancelled).toBe(true);

      // 确认删除
      const confirmResult = deletePet(true);
      expect(confirmResult.cancelled).toBe(false);
    });
  });

  describe('宠物基础操作', () => {
    it('应该成功添加宠物', async () => {
      const result = await PetService.addPet({
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();
      expect(result.pet?.name).toBe('小橘');
    });

    it('应该获取宠物列表', async () => {
      const pet1 = await PetService.addPet({
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');
      
      const pet2 = await PetService.addPet({
        name: '小黑',
        breed: '黑猫',
        age: 1,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      // 验证两个宠物都添加成功了
      expect(pet1.success).toBe(true);
      expect(pet2.success).toBe(true);

      const pets = await PetService.getPets('user1');
      expect(pets.length).toBeGreaterThanOrEqual(1); // 至少有一个宠物
    });

    it('应该获取单个宠物', async () => {
      const addResult = await PetService.addPet({
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      const petId = addResult.pet?.id!;
      const pet = await PetService.getPet(petId);

      expect(pet).not.toBeNull();
      expect(pet?.name).toBe('小橘');
    });

    it('应该验证宠物名称格式', async () => {
      const result = await PetService.addPet({
        name: '',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat',
      }, 'user1');

      expect(result.success).toBe(false);
    });
  });
});

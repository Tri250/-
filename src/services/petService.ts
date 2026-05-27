// ============================================
// PawSync Pro - petService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 宠物服务 - UC-015到UC-017
// ============================================

import { validatePetName, sanitizeText } from './securityService';

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  avatarUrl: string;
  type: 'cat' | 'dog' | 'other';
  createdAt: string;
}

// 模拟宠物数据库
const petDatabase: Map<string, Pet> = new Map();

export class PetService {
  // 添加宠物
  static async addPet(petData: Omit<Pet, 'id' | 'createdAt'>, userId: string): Promise<{ success: boolean; pet?: Pet; message?: string }> {
    // 验证宠物名称
    const nameValidation = validatePetName(petData.name);
    if (!nameValidation.valid) {
      return { success: false, message: nameValidation.message };
    }

    const newPet: Pet = {
      id: Date.now().toString(),
      ...petData,
      name: nameValidation.sanitized,
      createdAt: new Date().toISOString(),
    };

    petDatabase.set(newPet.id, newPet);
    return { success: true, pet: newPet };
  }

  // 获取宠物列表
  static async getPets(userId: string): Promise<Pet[]> {
    // 在真实环境中按用户ID筛选
    return Array.from(petDatabase.values());
  }

  // 获取单个宠物
  static async getPet(petId: string): Promise<Pet | null> {
    return petDatabase.get(petId) || null;
  }

  // UC-015: 更新宠物信息
  static async updatePet(petId: string, updates: Partial<Pet>): Promise<{ success: boolean; pet?: Pet; message?: string }> {
    const pet = petDatabase.get(petId);
    if (!pet) {
      return { success: false, message: '宠物不存在' };
    }

    // 如果更新名称，验证名称
    let sanitizedUpdates = { ...updates };
    if (updates.name !== undefined) {
      const nameValidation = validatePetName(updates.name);
      if (!nameValidation.valid) {
        return { success: false, message: nameValidation.message };
      }
      sanitizedUpdates.name = nameValidation.sanitized;
    }

    const updatedPet = {
      ...pet,
      ...sanitizedUpdates,
    };

    petDatabase.set(petId, updatedPet);
    return { success: true, pet: updatedPet, message: '更新成功' };
  }

  // UC-016: 删除宠物
  static async deletePet(petId: string): Promise<{ success: boolean; message?: string }> {
    const pet = petDatabase.get(petId);
    if (!pet) {
      return { success: false, message: '宠物不存在' };
    }

    petDatabase.delete(petId);
    return { success: true, message: '宠物已删除' };
  }

  // 清空数据库（用于测试）
  static clear(): void {
    petDatabase.clear();
  }
}

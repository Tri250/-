// 宠物档案相关类型

export interface Pet {
  id: string;
  name: string;
  avatar?: string;
  type: 'dog' | 'cat' | 'other';
  breed?: string;
  gender: 'male' | 'female';
  birthday?: string;
  weight?: number;
  color?: string;
  createdAt: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'concern';
  characteristics?: string;
}

export interface PetVaccine {
  id: string;
  petId: string;
  name: string;
  date: string;
  nextDate?: string;
  vet?: string;
  notes?: string;
}

export interface PetCheckup {
  id: string;
  petId: string;
  date: string;
  weight?: number;
  vet?: string;
  notes?: string;
  attachments?: string[];
}

export interface PetGrowth {
  id: string;
  petId: string;
  date: string;
  weight?: number;
  height?: number;
  notes?: string;
}

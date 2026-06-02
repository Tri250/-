// 宠物档案相关类型

export type PetType = 'dog' | 'cat' | 'rabbit' | 'hamster' | 'guinea_pig' | 'parrot' | 'cockatiel' | 'turtle' | 'lizard' | 'snake' | 'fish' | 'other';

export interface ExoticPetFields {
  habitat?: string;
  temperature?: string;
  humidity?: string;
  dietType?: string;
  activityPattern?: 'diurnal' | 'nocturnal' | 'crepuscular';
  specialNeeds?: string;
}

export interface Pet {
  id: string;
  uniqueCode: string;
  name: string;
  avatar?: string;
  type: PetType;
  breed?: string;
  gender: 'male' | 'female' | 'unknown';
  birthday?: string;
  weight?: number;
  color?: string;
  createdAt: string;
  updatedAt?: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'concern';
  characteristics?: string;
  exoticFields?: ExoticPetFields;
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

export interface PetTemplate {
  type: PetType;
  name: string;
  icon: string;
  defaultFields: Partial<Pet>;
  exoticFields?: ExoticPetFields;
}

export const PET_TEMPLATES: PetTemplate[] = [
  {
    type: 'dog',
    name: '狗狗',
    icon: '🐕',
    defaultFields: { type: 'dog', gender: 'male' },
  },
  {
    type: 'cat',
    name: '猫咪',
    icon: '🐱',
    defaultFields: { type: 'cat', gender: 'male' },
  },
  {
    type: 'rabbit',
    name: '兔子',
    icon: '🐰',
    defaultFields: { type: 'rabbit', gender: 'male' },
    exoticFields: { habitat: '室内笼养', dietType: '草食', activityPattern: 'crepuscular' },
  },
  {
    type: 'hamster',
    name: '仓鼠',
    icon: '🐹',
    defaultFields: { type: 'hamster', gender: 'male' },
    exoticFields: { habitat: '笼养', dietType: '杂食', activityPattern: 'nocturnal' },
  },
  {
    type: 'guinea_pig',
    name: '豚鼠',
    icon: '🐹',
    defaultFields: { type: 'guinea_pig', gender: 'male' },
    exoticFields: { habitat: '室内笼养', dietType: '草食', activityPattern: 'diurnal' },
  },
  {
    type: 'parrot',
    name: '鹦鹉',
    icon: '🦜',
    defaultFields: { type: 'parrot', gender: 'male' },
    exoticFields: { habitat: '鸟笼', dietType: '杂食', activityPattern: 'diurnal' },
  },
  {
    type: 'cockatiel',
    name: '玄凤鹦鹉',
    icon: '🦜',
    defaultFields: { type: 'cockatiel', gender: 'male' },
    exoticFields: { habitat: '鸟笼', dietType: '杂食', activityPattern: 'diurnal' },
  },
  {
    type: 'turtle',
    name: '乌龟',
    icon: '🐢',
    defaultFields: { type: 'turtle', gender: 'male' },
    exoticFields: { habitat: '水陆两栖箱', dietType: '杂食', activityPattern: 'diurnal', temperature: '25-30°C', humidity: '60-80%' },
  },
  {
    type: 'lizard',
    name: '蜥蜴',
    icon: '🦎',
    defaultFields: { type: 'lizard', gender: 'male' },
    exoticFields: { habitat: '爬虫箱', dietType: '肉食/杂食', activityPattern: 'diurnal', temperature: '28-35°C', humidity: '40-60%' },
  },
  {
    type: 'snake',
    name: '蛇',
    icon: '🐍',
    defaultFields: { type: 'snake', gender: 'male' },
    exoticFields: { habitat: '爬虫箱', dietType: '肉食', activityPattern: 'nocturnal', temperature: '25-30°C', humidity: '50-70%' },
  },
  {
    type: 'fish',
    name: '观赏鱼',
    icon: '🐠',
    defaultFields: { type: 'fish', gender: 'unknown' },
    exoticFields: { habitat: '水族箱', dietType: '杂食', temperature: '22-28°C', humidity: 'N/A' },
  },
  {
    type: 'other',
    name: '其他',
    icon: '🐾',
    defaultFields: { type: 'other', gender: 'unknown' },
  },
];

export function generateUniqueCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PET-${timestamp}-${random}`;
}

export function getPetTemplate(type: PetType): PetTemplate | undefined {
  return PET_TEMPLATES.find(t => t.type === type);
}

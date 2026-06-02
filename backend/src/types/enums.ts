export type PetType = 'DOG' | 'CAT' | 'OTHER';

export const PetType = {
  DOG: 'DOG',
  CAT: 'CAT',
  OTHER: 'OTHER',
} as const;

export type PetGender = 'MALE' | 'FEMALE';

export const PetGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CONCERN';

export const HealthStatus = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  CONCERN: 'CONCERN',
} as const;

export type RecordType = 'TEXT' | 'VOICE' | 'PHOTO' | 'VIDEO' | 'FILE';

export const RecordType = {
  TEXT: 'TEXT',
  VOICE: 'VOICE',
  PHOTO: 'PHOTO',
  VIDEO: 'VIDEO',
  FILE: 'FILE',
} as const;

export type ReminderType =
  | 'VACCINE'
  | 'DEWORMING'
  | 'CHECKUP'
  | 'BATH'
  | 'BRUSH_TEETH'
  | 'MEDICINE'
  | 'GROOMING'
  | 'CUSTOM';

export const ReminderType = {
  VACCINE: 'VACCINE',
  DEWORMING: 'DEWORMING',
  CHECKUP: 'CHECKUP',
  BATH: 'BATH',
  BRUSH_TEETH: 'BRUSH_TEETH',
  MEDICINE: 'MEDICINE',
  GROOMING: 'GROOMING',
  CUSTOM: 'CUSTOM',
} as const;

export type RepeatType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const RepeatType = {
  ONCE: 'ONCE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type ManualCategory = 'NUTRITION' | 'CARE' | 'BEHAVIOR' | 'EMERGENCY' | 'TRAINING';

export const ManualCategory = {
  NUTRITION: 'NUTRITION',
  CARE: 'CARE',
  BEHAVIOR: 'BEHAVIOR',
  EMERGENCY: 'EMERGENCY',
  TRAINING: 'TRAINING',
} as const;

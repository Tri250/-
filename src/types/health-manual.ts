// 健康手册相关类型

export type ManualCategory = 'nutrition' | 'care' | 'behavior' | 'emergency';

export interface HealthManual {
  id: string;
  category: ManualCategory;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  forType: 'dog' | 'cat' | 'both';
  readTime: number;
  isPopular: boolean;
  tags: string[];
  createdAt: string;
}

export const MANUAL_CATEGORIES: { id: ManualCategory; name: string; icon: string; color: string }[] = [
  { id: 'nutrition', name: '营养饮食', icon: '🍎', color: '#FF6B00' },
  { id: 'care', name: '日常护理', icon: '🛁', color: '#0E9CE5' },
  { id: 'behavior', name: '行为识别', icon: '🐾', color: '#10B981' },
  { id: 'emergency', name: '应急处理', icon: '🏥', color: '#EF4444' },
];

export const SAMPLE_MANUALS: HealthManual[] = [
  {
    id: '1',
    category: 'nutrition',
    title: '猫咪科学喂养指南',
    summary: '从幼猫到老年猫的完整营养方案',
    content: `# 猫咪科学喂养指南

## 幼猫期（0-6个月）
幼猫处于快速生长阶段，需要更多的蛋白质和热量。选择高品质幼猫粮，每天喂养3-4次。

## 成年期（7个月-7岁）
成年猫饮食要均衡，控制体重。每天2次定时定量喂养，保证充足饮水。

## 老年期（7岁以上）
老年猫消化功能下降，选择专用老年猫粮，注意肾脏和关节健康。

## 常见误区
❌ 只喂猫粮，忽略湿粮
❌ 喂食人类食物
❌ 过度喂养导致肥胖`,
    forType: 'cat',
    readTime: 5,
    isPopular: true,
    tags: ['猫粮', '营养', '喂养'],
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    category: 'behavior',
    title: '狗狗异常行为识别',
    summary: '读懂狗狗的求救信号',
    content: `# 狗狗异常行为识别指南

## 过度舔舐
如果狗狗频繁舔舐某个部位，可能是皮肤问题或焦虑表现。

## 食欲不振
超过24小时不吃东西要引起重视，可能是健康问题。

## 突然攻击性
性格突变可能是疼痛或疾病的信号。

## 如厕习惯改变
不在指定地点大小便可能是泌尿系统问题。`,
    forType: 'dog',
    readTime: 4,
    isPopular: true,
    tags: ['行为', '健康信号'],
    createdAt: '2024-01-02',
  },
  {
    id: '3',
    category: 'emergency',
    title: '宠物急救常识',
    summary: '关键时刻能救命的急救知识',
    content: `# 宠物急救常识

## 中毒
- 立即催吐（2小时内）
- 带上可疑物品去医院
- 不要自行用药

## 外伤出血
- 用干净纱布按压止血
- 严重出血使用止血带
- 尽快送医

## 中暑
- 立即转移到阴凉处
- 用凉水降温（不要用冰水）
- 补充水分`,
    forType: 'both',
    readTime: 6,
    isPopular: true,
    tags: ['急救', '安全'],
    createdAt: '2024-01-03',
  },
  {
    id: '4',
    category: 'care',
    title: '宠物口腔护理全攻略',
    summary: '预防牙周病，保持健康牙齿',
    content: `# 宠物口腔护理全攻略

## 为什么重要
牙周病是宠物最常见的疾病之一，会影响心脏、肾脏等重要器官。

## 日常护理
1. 每天刷牙（使用宠物专用牙膏）
2. 提供洁牙零食
3. 定期口腔检查

## 异常信号
- 口臭严重
- 牙龈红肿
- 进食困难`,
    forType: 'both',
    readTime: 3,
    isPopular: false,
    tags: ['口腔', '护理', '牙齿'],
    createdAt: '2024-01-04',
  },
];

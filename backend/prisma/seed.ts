import { PrismaClient, PetType, PetGender, HealthStatus, ManualCategory } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  const password = await hashPassword('password123');

  const user = await prisma.user.create({
    data: {
      email: 'demo@pawsync.pro',
      name: '演示用户',
      password,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    },
  });

  console.log('创建用户:', user.email);

  const pet1 = await prisma.pet.create({
    data: {
      userId: user.id,
      name: '毛球',
      avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200',
      type: PetType.CAT,
      breed: '英国短毛猫',
      gender: PetGender.MALE,
      birthday: new Date('2022-05-15'),
      weight: 5.2,
      color: '橘白',
      characteristics: '黏人、喜欢晒太阳、怕生人',
      healthStatus: HealthStatus.GOOD,
    },
  });

  const pet2 = await prisma.pet.create({
    data: {
      userId: user.id,
      name: '旺财',
      avatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200',
      type: PetType.DOG,
      breed: '柯基犬',
      gender: PetGender.MALE,
      birthday: new Date('2023-01-20'),
      weight: 12.5,
      color: '黄白',
      characteristics: '活泼、精力充沛、喜欢捡球',
      healthStatus: HealthStatus.EXCELLENT,
    },
  });

  console.log('创建宠物:', pet1.name, pet2.name);

  await prisma.healthRecord.createMany({
    data: [
      {
        petId: pet1.id,
        type: 'TEXT',
        title: '日常检查',
        content: '今天毛球精神很好，食欲正常，大便正常。继续保持。',
        tags: ['日常', '健康'],
        isImportant: false,
      },
      {
        petId: pet1.id,
        type: 'TEXT',
        title: '驱虫记录',
        content: '2024年1月15日进行体内外驱虫，使用拜宠清。',
        tags: ['驱虫', '医疗'],
        isImportant: true,
      },
      {
        petId: pet2.id,
        type: 'TEXT',
        title: '疫苗接种',
        content: '完成六联疫苗接种，下次加强针在6个月后。',
        tags: ['疫苗', '医疗'],
        isImportant: true,
      },
    ],
  });

  await prisma.petVaccine.createMany({
    data: [
      {
        petId: pet1.id,
        name: '猫三联',
        date: new Date('2024-01-10'),
        nextDate: new Date('2024-07-10'),
        vet: '张医生',
        notes: '基础免疫',
      },
      {
        petId: pet2.id,
        name: '六联疫苗',
        date: new Date('2024-01-20'),
        nextDate: new Date('2024-07-20'),
        vet: '李医生',
        notes: '基础免疫',
      },
    ],
  });

  await prisma.reminder.createMany({
    data: [
      {
        petId: pet1.id,
        type: 'VACCINE',
        title: '猫三联疫苗',
        notes: '加强免疫',
        date: new Date('2024-07-10'),
        time: '10:00',
        repeat: 'YEARLY',
      },
      {
        petId: pet2.id,
        type: 'DEWORMING',
        title: '体内驱虫',
        notes: '每月一次',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        time: '09:00',
        repeat: 'MONTHLY',
      },
      {
        petId: pet2.id,
        type: 'BATH',
        title: '洗澡',
        notes: '每周一次',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        time: '15:00',
        repeat: 'WEEKLY',
      },
    ],
  });

  await prisma.healthManual.createMany({
    data: [
      {
        title: '猫咪健康饮食指南',
        content: `
# 猫咪健康饮食指南

## 基础营养需求
- 优质蛋白质来源
- 适量的脂肪
- 维生素和矿物质
- 充足的水分

## 喂食建议
1. 定时定量喂食
2. 选择适合年龄的猫粮
3. 避免人类食物
4. 保持饮水新鲜

## 注意事项
- 避免过度喂养
- 观察排便情况
- 定期体重监控
        `.trim(),
        category: ManualCategory.NUTRITION,
        petType: PetType.CAT,
        tags: ['饮食', '营养', '猫粮'],
        author: '兽医团队',
        isOfficial: true,
      },
      {
        title: '狗狗日常护理要点',
        content: `
# 狗狗日常护理要点

## 毛发护理
- 定期梳毛
- 适当洗澡
- 注意皮肤健康

## 口腔护理
- 每天刷牙
- 提供洁牙玩具
- 定期口腔检查

## 运动与玩耍
- 每天充足运动
- 互动游戏
- 社交活动
        `.trim(),
        category: ManualCategory.CARE,
        petType: PetType.DOG,
        tags: ['护理', '毛发', '口腔'],
        author: '兽医团队',
        isOfficial: true,
      },
      {
        title: '宠物常见异常行为识别',
        content: `
# 宠物常见异常行为识别

## 需要注意的行为
- 突然食欲下降
- 过度舔舐
- 攻击性增强
- 过度吠叫/喵叫
- 躲避主人

## 可能的原因
- 身体不适
- 压力焦虑
- 环境变化
- 老年问题

## 应对建议
1. 观察记录行为变化
2. 检查身体状况
3. 就医咨询
4. 调整环境
        `.trim(),
        category: ManualCategory.BEHAVIOR,
        tags: ['行为', '异常', '健康'],
        author: '兽医团队',
        isOfficial: true,
      },
      {
        title: '宠物紧急情况处理',
        content: `
# 宠物紧急情况处理

## 常见紧急情况
- 食物中毒
- 外伤出血
- 中暑
- 呼吸困难
- 癫痫发作

## 紧急处理原则
1. 保持冷静
2. 确保安全
3. 初步处理
4. 尽快就医

## 急救箱必备
- 纱布绷带
- 消毒液
- 镊子
- 止血粉
- 紧急联系方式
        `.trim(),
        category: ManualCategory.EMERGENCY,
        tags: ['急救', '紧急', '安全'],
        author: '兽医团队',
        isOfficial: true,
      },
      {
        title: '幼犬基础训练入门',
        content: `
# 幼犬基础训练入门

## 训练原则
- 耐心和一致性
- 正面强化
- 循序渐进

## 基础训练项目
1. 如厕训练
2. 基本指令（坐下、等待、过来）
3. 社交化
4. 笼内训练

## 注意事项
- 训练时间不宜过长
- 保持愉快氛围
- 及时奖励
        `.trim(),
        category: ManualCategory.TRAINING,
        petType: PetType.DOG,
        tags: ['训练', '幼犬', '教育'],
        author: '训犬师团队',
        isOfficial: true,
      },
    ],
  });

  await prisma.petGrowth.createMany({
    data: [
      {
        petId: pet1.id,
        date: new Date('2024-01-01'),
        weight: 5.0,
        notes: '初诊记录',
      },
      {
        petId: pet1.id,
        date: new Date('2024-02-01'),
        weight: 5.2,
        notes: '体重稳定',
      },
      {
        petId: pet2.id,
        date: new Date('2024-01-20'),
        weight: 12.0,
        notes: '初诊记录',
      },
      {
        petId: pet2.id,
        date: new Date('2024-02-20'),
        weight: 12.5,
        notes: '成长良好',
      },
    ],
  });

  console.log('播种数据完成!');
  console.log('');
  console.log('演示账号:');
  console.log('  邮箱: demo@pawsync.pro');
  console.log('  密码: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

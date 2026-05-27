import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import prisma from '../lib/prisma';

import authRoutes from '../routes/auth';
import petRoutes from '../routes/pets';
import healthRecordRoutes from '../routes/healthRecords';
import reminderRoutes from '../routes/reminders';
import manualRoutes from '../routes/manuals';
import aiRoutes from '../routes/ai';
import { notFoundHandler } from '../middleware';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/manuals', manualRoutes);
app.use('/api/ai', aiRoutes);
app.use(notFoundHandler);

describe('PawSync Pro API Testing', () => {
  let token: string;
  let petId: string;
  let healthRecordId: string;
  let reminderId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'another@example.com'],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('AUTH - 用户认证模块', () => {
    it('AUTH-001: 新用户注册（正常流程）', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('AUTH-002: 用户注册-邮箱格式校验', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(res.status).toBe(400);
    });

    it('AUTH-004: 用户注册-重复邮箱', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('邮箱已注册');
    });

    it('AUTH-005: 用户登录（正常流程）', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });

    it('AUTH-006: 用户登录-错误密码', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('邮箱或密码错误');
    });

    it('AUTH-009: 获取当前用户信息', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('AUTH-011: 无 Token 访问受保护接口', async () => {
      const res = await request(app).get('/api/pets');
      expect(res.status).toBe(401);
    });
  });

  describe('PET - 宠物档案管理模块', () => {
    it('PET-001: 创建宠物-必填字段', async () => {
      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '旺财',
          type: 'DOG',
          gender: 'MALE',
        });

      expect(res.status).toBe(201);
      expect(res.body.pet.name).toBe('旺财');
      expect(res.body.pet.type).toBe('DOG');
      expect(res.body.pet.gender).toBe('MALE');
      expect(res.body.pet.healthStatus).toBe('GOOD');
      petId = res.body.pet.id;
    });

    it('PET-002: 创建宠物-全字段', async () => {
      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '咪咪',
          type: 'CAT',
          gender: 'FEMALE',
          breed: '英短',
          birthday: '2020-01-01',
          weight: 4.5,
          color: '灰色',
          characteristics: '性格温顺',
        });

      expect(res.status).toBe(201);
      expect(res.body.pet.name).toBe('咪咪');
      expect(res.body.pet.breed).toBe('英短');
      expect(res.body.pet.weight).toBe(4.5);
    });

    it('PET-003: 创建宠物-缺失必填字段', async () => {
      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'DOG',
          gender: 'MALE',
        });

      expect(res.status).toBe(400);
    });

    it('PET-008: 获取宠物列表-多宠物', async () => {
      const res = await request(app)
        .get('/api/pets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pets)).toBe(true);
      expect(res.body.pets.length).toBeGreaterThanOrEqual(2);
    });

    it('PET-009: 获取宠物详情', async () => {
      const res = await request(app)
        .get(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pet.id).toBe(petId);
      expect(res.body.pet.name).toBe('旺财');
    });

    it('PET-010: 获取宠物详情-不存在的id', async () => {
      const res = await request(app)
        .get('/api/pets/nonexistent-id-12345')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('宠物不存在');
    });

    it('PET-012: 更新宠物信息', async () => {
      const res = await request(app)
        .put(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '旺财旺财',
          weight: 15.5,
        });

      expect(res.status).toBe(200);
      expect(res.body.pet.name).toBe('旺财旺财');
      expect(res.body.pet.weight).toBe(15.5);
    });
  });

  describe('VAC - 疫苗与体检记录模块', () => {
    it('VAC-001: 添加疫苗记录', async () => {
      const res = await request(app)
        .post(`/api/pets/${petId}/vaccines`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '狂犬疫苗',
          date: '2024-01-15',
          nextDate: '2025-01-15',
          vet: '宠物医院',
          notes: '首次接种',
        });

      expect(res.status).toBe(201);
      expect(res.body.vaccine.name).toBe('狂犬疫苗');
    });

    it('VAC-002: 查询疫苗记录列表', async () => {
      const res = await request(app)
        .get(`/api/pets/${petId}/vaccines`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.vaccines)).toBe(true);
    });

    it('VAC-004: 添加体检记录', async () => {
      const res = await request(app)
        .post(`/api/pets/${petId}/checkups`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2024-06-01',
          weight: 14.5,
          vet: '宠物诊所',
          notes: '年度体检，健康状况良好',
        });

      expect(res.status).toBe(201);
      expect(res.body.checkup.weight).toBe(14.5);
    });

    it('VAC-005: 添加成长记录', async () => {
      const res = await request(app)
        .post(`/api/pets/${petId}/growth`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2024-06-15',
          weight: 15.0,
          height: 60.0,
          notes: '体重增长正常',
        });

      expect(res.status).toBe(201);
      expect(res.body.growthRecord.weight).toBe(15.0);
    });
  });

  describe('HR - 健康记录模块', () => {
    it('HR-001: 创建健康记录', async () => {
      const res = await request(app)
        .post('/api/health-records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          petId: petId,
          type: 'TEXT',
          title: '呕吐记录',
          content: '今天早上呕吐了一次，精神状态尚可',
          tags: ['呕吐', '饮食'],
        });

      expect(res.status).toBe(201);
      expect(res.body.record.title).toBe('呕吐记录');
      healthRecordId = res.body.record.id;
    });

    it('HR-002: 获取健康记录列表', async () => {
      const res = await request(app)
        .get('/api/health-records')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
    });

    it('HR-003: 搜索健康记录', async () => {
      const res = await request(app)
        .get('/api/health-records/search?q=呕吐')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
    });

    it('HR-005: 搜索-特殊字符（SQL注入防护）', async () => {
      const res = await request(app)
        .get("/api/health-records/search?q='; DROP TABLE users;--")
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
    });

    it('HR-006: 更新健康记录', async () => {
      const res = await request(app)
        .put(`/api/health-records/${healthRecordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '呕吐记录-已更新',
          content: '补充：呕吐后喂食正常',
        });

      expect(res.status).toBe(200);
      expect(res.body.record.title).toBe('呕吐记录-已更新');
    });
  });

  describe('AI - AI健康顾问模块', () => {
    it('AI-001: AI对话-发起新会话', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          petId: petId,
          message: '狗狗呕吐了需要去医院吗？',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('conversation');
      expect(res.body).toHaveProperty('response');
    });

    it('AI-003: AI对话-空消息', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          petId: petId,
          message: '',
        });

      expect(res.status).toBe(400);
    });

    it('AI-007: 获取对话历史', async () => {
      const res = await request(app)
        .get(`/api/ai/conversations/${petId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('AI-008: 生成健康报告', async () => {
      const res = await request(app)
        .post('/api/ai/generate-report')
        .set('Authorization', `Bearer ${token}`)
        .send({
          petId: petId,
        });

      expect(res.status).toBe(200);
      expect(res.body.report).toHaveProperty('petName');
      expect(res.body.report).toHaveProperty('summary');
      expect(res.body.report).toHaveProperty('recommendations');
    });
  });

  describe('REM - 智能提醒模块', () => {
    it('REM-001: 创建一次性提醒', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          petId: petId,
          type: 'VACCINE',
          title: '狂犬疫苗接种提醒',
          date: tomorrow.toISOString().split('T')[0],
          time: '09:00',
          repeat: 'ONCE',
        });

      expect(res.status).toBe(201);
      expect(res.body.reminder.title).toBe('狂犬疫苗接种提醒');
      reminderId = res.body.reminder.id;
    });

    it('REM-002: 创建周期提醒-每天', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          petId: petId,
          type: 'MEDICINE',
          title: '每日服药提醒',
          date: tomorrow.toISOString().split('T')[0],
          time: '18:00',
          repeat: 'DAILY',
        });

      expect(res.status).toBe(201);
      expect(res.body.reminder.repeat).toBe('DAILY');
    });

    it('REM-008: 获取提醒列表', async () => {
      const res = await request(app)
        .get('/api/reminders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reminders)).toBe(true);
    });

    it('REM-009: 即将到期提醒', async () => {
      const res = await request(app)
        .get('/api/reminders/upcoming')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reminders)).toBe(true);
    });

    it('REM-010: 标记提醒完成', async () => {
      const res = await request(app)
        .post(`/api/reminders/${reminderId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.reminder.isCompleted).toBe(true);
    });

    it('REM-012: 更新提醒', async () => {
      const res = await request(app)
        .put(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '狂犬疫苗接种提醒-已更新',
        });

      expect(res.status).toBe(200);
      expect(res.body.reminder.title).toBe('狂犬疫苗接种提醒-已更新');
    });
  });

  describe('MAN - 健康手册模块', () => {
    it('MAN-001: 获取手册列表', async () => {
      const res = await request(app).get('/api/manuals');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.manuals)).toBe(true);
    });

    it('MAN-002: 按分类筛选', async () => {
      const res = await request(app).get('/api/manuals?category=EMERGENCY');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.manuals)).toBe(true);
    });

    it('MAN-003: 按宠物类型筛选', async () => {
      const res = await request(app).get('/api/manuals?petType=DOG');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.manuals)).toBe(true);
    });

    it('MAN-004: 搜索手册', async () => {
      const res = await request(app).get('/api/manuals/search?q=营养');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.manuals)).toBe(true);
    });

    it('MAN-006: 添加书签', async () => {
      const manuals = await request(app).get('/api/manuals');
      const firstManualId = manuals.body.manuals[0]?.id;
      
      if (firstManualId) {
        const res = await request(app)
          .post(`/api/manuals/${firstManualId}/bookmark`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(201);
      }
    });

    it('MAN-007: 获取我的书签', async () => {
      const res = await request(app)
        .get('/api/manuals/bookmarks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.bookmarks)).toBe(true);
    });
  });

  describe('API - 接口测试', () => {
    it('API-008: 404 统一处理', async () => {
      const res = await request(app).get('/api/nonexistent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('接口不存在');
    });

    it('API-004: CORS 跨域配置', async () => {
      const res = await request(app)
        .options('/api/auth/register')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(204);
    });
  });

  describe('SEC - 安全性测试', () => {
    it('SEC-001: SQL 注入-搜索接口', async () => {
      const res = await request(app)
        .get("/api/manuals/search?q='; DROP TABLE users;--")
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('SEC-009: 越权访问-宠物数据', async () => {
      const anotherUserToken = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another@example.com',
          password: 'Password123!',
          name: 'Another User',
        })
        .then(res => res.body.token);

      const res = await request(app)
        .get(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(res.status).toBe(404);
    });
  });
});
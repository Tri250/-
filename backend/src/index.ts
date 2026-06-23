import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler, rateLimiter, requestLogger } from './middleware';
import authRoutes from './routes/auth';
import petRoutes from './routes/pets';
import healthRecordRoutes from './routes/healthRecords';
import healthLiveRoutes from './routes/healthLive';
import reminderRoutes from './routes/reminders';
import manualRoutes from './routes/manuals';
import aiRoutes from './routes/ai';
import cameraRoutes from './routes/cameras';
import fileRoutes from './routes/files';
import subscriptionRoutes from './routes/subscriptions';
import pushRoutes from './routes/push';
import iotRoutes from './routes/iotDevices';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 全局中间件
app.use(requestLogger);
app.use(rateLimiter);

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/health-records', healthLiveRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/manuals', manualRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/iot-devices', iotRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PawSync Pro API 运行正常', version: '3.0.0' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`
  🚀 PawSync Pro API 服务器已启动!
  📍 本地访问: http://localhost:${config.port}
  🏥 健康检查: http://localhost:${config.port}/api/health
  📚 API 路由:
     - /api/auth         认证
     - /api/pets         宠物管理
     - /api/health-records 健康记录
     - /api/health-records/live 实时健康数据
     - /api/reminders    提醒
     - /api/manuals      健康手册
     - /api/ai           AI对话
     - /api/cameras      摄像头管理
     - /api/files        文件上传
     - /api/subscriptions 订阅管理
     - /api/push         推送通知
     - /api/iot-devices  IoT设备
  `);
});

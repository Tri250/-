import express from 'express';
import cors from 'cors';
import { config } from './config';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth';
import petRoutes from './routes/pets';
import healthRecordRoutes from './routes/healthRecords';
import reminderRoutes from './routes/reminders';
import manualRoutes from './routes/manuals';
import aiRoutes from './routes/ai';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/manuals', manualRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PawSync Pro API 运行正常' });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(config.port, () => {
  console.log(`
  🚀 PawSync Pro API 服务器已启动!
  📍 本地访问: http://localhost:${config.port}
  🏥 健康检查: http://localhost:${config.port}/api/health
  📚 API 文档: 详见 ARCHITECTURE.md
  `);
});

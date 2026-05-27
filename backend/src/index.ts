import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import authRoutes from './routes/auth';
import petRoutes from './routes/pets';
import healthRecordRoutes from './routes/healthRecords';
import reminderRoutes from './routes/reminders';
import manualRoutes from './routes/manuals';
import aiRoutes from './routes/ai';
import voiceRoutes from './routes/voice';
import behaviorRoutes from './routes/behavior';
import healthRoutes from './routes/health';
import foodRoutes from './routes/food';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/manuals', manualRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/food', foodRoutes);

app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', message: 'PetGuardian API 运行正常' });
});

app.get('/api/features', (req, res) => {
  res.json({
    code: 200,
    message: '功能列表',
    data: {
      features: [
        { id: 'voice-analysis', name: '声音情绪识别', description: '识别宠物声音中的情绪', status: 'enabled' },
        { id: 'voice-translation', name: '声音意图翻译', description: '将宠物声音翻译成人类语言', status: 'enabled' },
        { id: 'voice-clone', name: '声音克隆', description: '克隆宠物声音', status: 'enabled' },
        { id: 'behavior-recognition', name: '行为识别', description: '25+种行为类型识别', status: 'enabled' },
        { id: 'emotion-analysis', name: '情绪分析', description: '多模态情绪分析', status: 'enabled' },
        { id: 'multimodal-fusion', name: '三模融合', description: '行为+声音+表情融合分析', status: 'enabled' },
        { id: 'health-alerts', name: '健康预警', description: '7级健康预警体系', status: 'enabled' },
        { id: 'ai-diagnosis', name: 'AI初诊', description: '基于症状的AI诊断', status: 'enabled' },
        { id: 'daily-journal', name: '宠物日记', description: '自动生成每日日记', status: 'enabled' },
        { id: 'food-analysis', name: '宠物粮分析', description: '配料表OCR分析', status: 'enabled' },
        { id: 'nutrition-recommend', name: '营养建议', description: '个性化营养建议', status: 'enabled' },
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`
  🚀 PetGuardian API 服务器已启动!
  📍 本地访问: http://localhost:${config.port}
  🏥 健康检查: http://localhost:${config.port}/api/health-check
  ✨ 功能列表: http://localhost:${config.port}/api/features
  📚 作者: 带娃的小陈宫
  `);
});

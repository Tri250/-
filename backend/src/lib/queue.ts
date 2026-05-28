import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import prisma from './prisma';
import { generateHealthReport } from './ai-service';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

const connection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const reportQueue = new Queue('health-reports', { connection });

export async function addReportTask(petId: string, userId: string) {
  const job = await reportQueue.add('generate-report', { petId, userId });
  return job.id;
}

export async function getTaskStatus(jobId: string) {
  const job = await reportQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress;
  const result = job.returnvalue;
  const failedReason = job.failedReason;

  return {
    jobId,
    state,
    progress,
    result,
    failedReason,
  };
}

const worker = new Worker(
  'health-reports',
  async (job) => {
    const { petId, userId } = job.data;

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new Error('宠物不存在');
    }

    const [healthRecords, vaccines, checkups, growthRecords] = await Promise.all([
      prisma.healthRecord.findMany({
        where: { petId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.petVaccine.findMany({
        where: { petId },
        orderBy: { date: 'desc' },
        take: 20,
      }),
      prisma.petCheckup.findMany({
        where: { petId },
        orderBy: { date: 'desc' },
        take: 20,
      }),
      prisma.petGrowth.findMany({
        where: { petId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
    ]);

    const reportContent = await generateHealthReport(
      pet,
      healthRecords,
      vaccines,
      checkups,
      growthRecords
    );

    const report = await prisma.healthReport.create({
      data: {
        userId,
        petId,
        content: reportContent,
      },
    });

    return { reportId: report.id, content: reportContent };
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

process.on('SIGINT', async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
});

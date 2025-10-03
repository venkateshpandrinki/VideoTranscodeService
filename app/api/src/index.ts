import express from 'express';
import dotenv from 'dotenv';
import { config } from './config.js';
import videosRouter from './routes/videos.js';
import { prisma } from './prisma.js';
import { transcodeQueue } from './queue.js';
import cors from 'cors';
import { ensureBucketExists } from './utils/bucket-checker.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);

app.use('/api/videos', videosRouter);

app.get('/ping', (_req, res) => res.send('pong'));
app.post('/auth/sync', async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });

    res.json(user);
  } catch (error) {
    logger.error({ err: error }, 'Error syncing user');
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

async function start() {
  await ensureBucketExists();
  app.listen(config.port, async () => {
    logger.info({ port: config.port }, 'API server started');
    try {
      // warm DB connection
      await prisma.$connect();
      logger.info('Prisma connected');
      // test redis by making a dummy call to the queue's client
      const redisClient = await transcodeQueue.client;
      await redisClient.ping();
      logger.info('Redis (bullmq) rechable');
    } catch (e) {
      logger.error({ err: e }, 'Startup error');
      process.exit(1);
    }
  });
}

start();

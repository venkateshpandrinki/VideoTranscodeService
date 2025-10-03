import express from 'express';
import multer from 'multer';
import { prisma } from '../prisma.js';
import { config, minioClient } from '../config.js';
import { transcodeQueue } from '../queue.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Multer in-memory (only used for legacy multipart upload route)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/videos  -> create DB record and return videoId
router.post('/', async (req, res) => {
  try {
    const { title, description, ownerId } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const v = await prisma.video.create({
      data: {
        title,
        description,
        ownerId,
        storageBaseUri: '',
      },
    });
    // LOGGING: Log success
    logger.info({ videoId: v.id, ownerId: v.ownerId }, 'Video record created successfully');

    const storageBaseUri = `${process.env.PUBLIC_HLS_BASE_URL || config.publicHlsBaseUrl}/hls/${v.id}`;
    await prisma.video.update({
      where: { id: v.id },
      data: { storageBaseUri },
    });

    res.json({ videoId: v.id });
    logger.info({ videoId: v.id, ownerId: v.ownerId }, 'Video record creation response sent');
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({ err: error }, 'failed to create video in db');

    res.status(500).json({ error: error.message });
  }
});

// PUT /api/videos/:id/file -> legacy direct multipart upload (backend streams into MinIO)
router.put('/:id/file', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file is required' });

    // verify video exists
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: 'video not found' });

    // put to MinIO
    const objectKey = `uploads/${id}/${Date.now()}-${file.originalname}`;
    await minioClient.putObject(config.minio.bucket, objectKey, file.buffer);

    await prisma.video.update({
      where: { id },
      data: {
        srcObjectKey: objectKey,
        status: 'processing',
      },
    });

    await prisma.job.create({
      data: {
        videoId: id,
        type: 'transcode',
        status: 'queued',
      },
    });

    await transcodeQueue.add(
      id,
      {
        videoId: id,
        srcObjectKey: objectKey,
        storageBaseUri: `${process.env.PUBLIC_HLS_BASE_URL || config.publicHlsBaseUrl}/hls/${id}`,
      },
      { jobId: id }
    );

    res.json({ message: 'file uploaded, transcode queued', videoId: id });
    logger.info(
      { videoId: id, objectKey, ownerId: video?.ownerId },
      'File uploaded and transcode job queued'
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(
      {
        err: error,
        videoId: req.params.id,
        route: 'PUT /api/videos/:id/file',
      },
      'Failed during file upload or job queueing'
    );

    res.status(500).json({ error: error.message });
  }
});

// NEW: POST /api/videos/:id/presign -> return presigned URL for direct client → MinIO upload
router.post('/:id/presign', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: 'video not found' });

    const objectKey = `uploads/${id}/${Date.now()}.mp4`;
    const url = await minioClient.presignedPutObject(
      config.minio.bucket,
      objectKey,
      60 * 15 // 15 min expiry
    );

    res.json({ url, objectKey });
    logger.info({ videoId: id, objectKey }, 'Presigned URL generated successfully');
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(
      { err: error, videoId: req.params.id, route: 'POST /api/videos/:id/presign' },
      'Failed to generate presigned URL'
    );
    res.status(500).json({ error: error.message });
  }
});

// GET /api/videos/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const video = await prisma.video.findUnique({
      where: { id },
      include: { renditions: true, jobs: true },
    });
    if (!video) return res.status(404).json({ error: 'not found' });

    res.json({
      id: video.id,
      title: video.title,
      description: video.description,
      status: video.status,
      storageBaseUri: video.storageBaseUri,
      masterPlaylist: video.status === 'ready' ? `${video.storageBaseUri}/master.m3u8` : null,
      durationSeconds: video.durationSeconds,
      renditions: video.renditions,
      jobs: video.jobs,
    });
    logger.info(
      { videoId: video.id, ownerId: video.ownerId },
      'Video details fetched successfully'
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(
      { err: error, videoId: req.params.id, route: 'GET /api/videos/:id' },
      'Failed to fetch video'
    );
    res.status(500).json({ error: error.message });
  }
});

// POST /api/videos/:id/complete
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { objectKey } = req.body;

    if (!objectKey) {
      return res.status(400).json({ error: 'objectKey is required' });
    }

    // Check video exists
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return res.status(404).json({ error: 'video not found' });
    }

    // Update DB: mark as processing
    await prisma.video.update({
      where: { id },
      data: {
        srcObjectKey: objectKey,
        status: 'processing',
      },
    });

    // Create job entry
    await prisma.job.create({
      data: {
        videoId: id,
        type: 'transcode',
        status: 'queued',
      },
    });

    // Push job to BullMQ
    await transcodeQueue.add(
      id,
      {
        videoId: id,
        srcObjectKey: objectKey,
        storageBaseUri: `${process.env.PUBLIC_HLS_BASE_URL || config.publicHlsBaseUrl}/hls/${id}`,
      },
      { jobId: id,
        attempts:3,
        backoff:{
          type:'exponential',
          delay:5000
        },
        removeOnComplete:1000,
        removeOnFail:true
       }
    );

    res.json({ message: 'upload complete, transcode queued', videoId: id });
    logger.info({ videoId: id, objectKey }, 'Upload complete and transcode job queued');
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(
      { err: error, videoId: req.params.id, route: 'POST /api/videos/:id/complete' },
      'Failed to complete upload or queue transcode'
    );
    res.status(500).json({ error: error.message });
  }
});

// GET /api/videos
router.get('/', async (req, res) => {
  const ownerId = req.query.ownerId as string | undefined;
  const videos = await prisma.video.findMany({
    where: ownerId ? { ownerId } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(videos);
  logger.info({ count: videos.length, ownerId }, 'Fetched video list');
});

export default router;

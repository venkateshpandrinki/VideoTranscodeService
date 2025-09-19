import express from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../prisma.js";
import { config,minioClient } from "../config.js";
import { transcodeQueue } from "../queue.js";


const router = express.Router();

// Multer in-memory (only used for legacy multipart upload route)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/videos  -> create DB record and return videoId
router.post("/", async (req, res) => {
  try {
    const { title, description, ownerId } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const v = await prisma.video.create({
      data: {
        title,
        description,
        ownerId,
        storageBaseUri: "", // will update after upload/transcode
      },
    });

    const storageBaseUri = `${process.env.PUBLIC_HLS_BASE_URL || config.publicHlsBaseUrl}/hls/${v.id}`;
    await prisma.video.update({
      where: { id: v.id },
      data: { storageBaseUri },
    });

    res.json({ videoId: v.id });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/videos/:id/file -> legacy direct multipart upload (backend streams into MinIO)
router.put("/:id/file", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    if(!id ) return res.status(400).json({error:"id is required"});
    const file = req.file;
    if (!file) return res.status(400).json({ error: "file is required" });

    // verify video exists
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: "video not found" });

    // put to MinIO
    const objectKey = `uploads/${id}/${Date.now()}-${file.originalname}`;
    await minioClient.putObject(config.minio.bucket, objectKey, file.buffer);

    await prisma.video.update({
      where: { id },
      data: {
        srcObjectKey: objectKey,
        status: "processing",
      },
    });

    await prisma.job.create({
      data: {
        videoId: id,
        type: "transcode",
        status: "queued",
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

    res.json({ message: "file uploaded, transcode queued", videoId: id });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// NEW: POST /api/videos/:id/presign -> return presigned URL for direct client → MinIO upload
router.post("/:id/presign", async (req, res) => {
  try {
    const { id } = req.params;
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: "video not found" });

    const objectKey = `uploads/${id}/${Date.now()}.mp4`;
    const url = await minioClient.presignedPutObject(
      config.minio.bucket,
      objectKey,
      60 * 15 // 15 min expiry
    );

    res.json({ url, objectKey });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/:id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const video = await prisma.video.findUnique({
      where: { id },
      include: { renditions: true, jobs: true },
    });
    if (!video) return res.status(404).json({ error: "not found" });

    res.json({
      id: video.id,
      title: video.title,
      description: video.description,
      status: video.status,
      storageBaseUri: video.storageBaseUri,
      masterPlaylist:
        video.status === "ready"
          ? `${video.storageBaseUri}/master.m3u8`
          : null,
      durationSeconds: video.durationSeconds,
      renditions: video.renditions,
      jobs: video.jobs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/videos/:id/complete
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params
    const { objectKey } = req.body

    if (!objectKey) {
      return res.status(400).json({ error: "objectKey is required" })
    }

    // Check video exists
    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) {
      return res.status(404).json({ error: "video not found" })
    }

    // Update DB: mark as processing
    await prisma.video.update({
      where: { id },
      data: {
        srcObjectKey: objectKey,
        status: "processing",
      },
    })

    // Create job entry
    await prisma.job.create({
      data: {
        videoId: id,
        type: "transcode",
        status: "queued",
      },
    })

    // Push job to BullMQ
    await transcodeQueue.add(
      id,
      {
        videoId: id,
        srcObjectKey: objectKey,
        storageBaseUri: `${
          process.env.PUBLIC_HLS_BASE_URL || config.publicHlsBaseUrl
        }/hls/${id}`,
      },
      { jobId: id }
    )

    res.json({ message: "upload complete, transcode queued", videoId: id })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})


// GET /api/videos
router.get("/", async (req, res) => {
  const ownerId = req.query.ownerId as string | undefined;
  const videos = await prisma.video.findMany({
    where: ownerId ? { ownerId } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(videos);
});

export default router;

// app/worker/src/worker.ts
import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import * as Minio from 'minio'

import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { spawn } from "child_process";

type TranscodeJobData = {
  jobId?: number | string;
  videoId: string;
  srcObjectKey: string; // e.g. uploads/originals/video.mp4
};

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest:null,
});

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || (process.env.MINIO_HOST || "minio"),
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: (process.env.MINIO_USE_SSL || "false") === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minio",
  secretKey: process.env.MINIO_SECRET_KEY || "minio123",
});

const MINIO_BUCKET = process.env.MINIO_BUCKET || "videos";
const prisma = new PrismaClient();

// function fGetObjectToFile(bucket: string, objectName: string, filePath: string) {
//   return new Promise<void>((resolve, reject) => {
//     minioClient.fGetObject(bucket, objectName, filePath, (err) => {
//       if (err) return reject(err);
//       resolve();
//     });
//   });
// }
// function fPutFile(bucket: string, objectName: string, filePath: string, meta?: Record<string, string>) {
//   return new Promise<void>((resolve, reject) => {
//     minioClient.fPutObject(bucket, objectName, filePath, meta || {}, (err) => {
//       if (err) return reject(err);
//       resolve();
//     });
//   });
// }

async function fGetObjectToFile(bucket: string, objectName: string, filePath: string) {
  await minioClient.fGetObject(bucket, objectName, filePath);
}

async function fPutFile(bucket: string, objectName: string, filePath: string, meta: Record<string, string> = {}) {
  await minioClient.fPutObject(bucket, objectName, filePath, meta);
}
async function uploadDirRecursive(localDir: string, bucket: string, remotePrefix: string) {
  const entries = await fs.readdir(localDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(localDir, entry.name);
    const remotePath = path.posix.join(remotePrefix, entry.name);
    if (entry.isDirectory()) {
      await uploadDirRecursive(fullPath, bucket, remotePath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const contentType = ext === ".m3u8" ? "application/vnd.apple.mpegurl" : ext === ".ts" ? "video/MP2T" : ext === ".jpg" ? "image/jpeg" : undefined;
      await fPutFile(bucket, remotePath, fullPath, contentType ? { "content-type": contentType } : undefined);
    }
  }
}

/** run command and stream logs */
function runCommand(cmd: string, args: string[], cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    p.stdout.on("data", (d) => process.stdout.write(`[${cmd}] ${d}`));
    p.stderr.on("data", (d) => process.stderr.write(`[${cmd}] ${d}`));
    p.on("error", (e) => reject(e));
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

/** Run ffmpeg one-shot HLS + thumbnail as per plan */
async function transcodeToHls(inputFile: string, outDir: string) {
  await fs.mkdir(outDir, { recursive: true });

  // Prepare subfolders names pattern: "%v/index.m3u8" -> outDir/0/index.m3u8 etc.
  // Use the robust ffmpeg command you provided (adjusted to use outDir)
  const segPattern = path.join(outDir, "%v", "seg_%03d.ts");
  const playlistPattern = path.join(outDir, "%v", "index.m3u8");
  const masterName = "master.m3u8";

  const ffArgs = [
    "-y",
    "-i", inputFile,
    "-filter_complex",
    `[0:v]split=4[v1][v2][v3][v4];[v1]scale=w=-2:h=1080[v1out];[v2]scale=w=-2:h=720[v2out];[v3]scale=w=-2:h=480[v3out];[v4]scale=w=-2:h=144[v4out]`,
    // 1080p
    "-map", "[v1out]", "-map", "0:a?", "-c:v:0", "libx264", "-profile:v:0", "high", "-preset", "veryfast", "-b:v:0", "5000k", "-maxrate:v:0", "5350k", "-bufsize:v:0", "7500k", "-g", "48", "-keyint_min", "48", "-sc_threshold", "0", "-c:a:0", "aac", "-b:a:0", "192k", "-ar", "48000",
    // 720p
    "-map", "[v2out]", "-map", "0:a?", "-c:v:1", "libx264", "-profile:v:1", "main", "-preset", "veryfast", "-b:v:1", "2800k", "-maxrate:v:1", "2990k", "-bufsize:v:1", "4200k", "-g", "48", "-keyint_min", "48", "-sc_threshold", "0", "-c:a:1", "aac", "-b:a:1", "160k", "-ar", "48000",
    // 480p
    "-map", "[v3out]", "-map", "0:a?", "-c:v:2", "libx264", "-profile:v:2", "main", "-preset", "veryfast", "-b:v:2", "1400k", "-maxrate:v:2", "1498k", "-bufsize:v:2", "2100k", "-g", "48", "-keyint_min", "48", "-sc_threshold", "0", "-c:a:2", "aac", "-b:a:2", "128k", "-ar", "48000",
    // 144p
    "-map", "[v4out]", "-map", "0:a?", "-c:v:3", "libx264", "-profile:v:3", "baseline", "-preset", "veryfast", "-b:v:3", "200k", "-maxrate:v:3", "214k", "-bufsize:v:3", "300k", "-g", "48", "-keyint_min", "48", "-sc_threshold", "0", "-c:a:3", "aac", "-b:a:3", "64k", "-ar", "48000",
    // HLS packaging
    "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod", "-hls_flags", "independent_segments",
    "-hls_segment_filename", segPattern,
    "-master_pl_name", masterName,
    "-var_stream_map", "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3",
    playlistPattern,
  ];

  await runCommand("ffmpeg", ffArgs, outDir);
  // generate thumbnail at 3s
  const thumbFile = path.join(outDir, "thumb.jpg");
  await runCommand("ffmpeg", ["-y", "-ss", "00:00:03", "-i", inputFile, "-frames:v", "1", "-q:v", "2", thumbFile], outDir);

  return { outDir, masterName, thumbFile };
}

/** the job handler */
async function handleJob(jobData: TranscodeJobData) {
  const { videoId, srcObjectKey, jobId } = jobData;
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), `transcode-${videoId}-`));
  const inputFile = path.join(tmpBase, "input");
  const outDir = path.join(tmpBase, "hls-out");

  console.log(`Starting job for video=${videoId} src=${srcObjectKey} tmp=${tmpBase}`);

  try {
    // mark processing (best-effort)
    try {
      await prisma.video.update({ where: { id: videoId }, data: { status: "processing" } as any });
    } catch (e) {
      console.warn("Couldn't set video processing status (maybe id mismatch):", e);
    }

    // download source
    console.log("Downloading source from MinIO...");
    await fGetObjectToFile(MINIO_BUCKET, srcObjectKey, inputFile);

    // optional: you can probe with ffprobe if you want (not required for the single-shot ffmpeg)
    // run ffmpeg -> HLS + thumbnail
    console.log("Running ffmpeg to produce HLS renditions...");
    const { outDir: producedDir, masterName, thumbFile } = await transcodeToHls(inputFile, outDir);

    // upload everything under hls/{videoId}/
    const remotePrefix = path.posix.join("hls", videoId);
    console.log("Uploading HLS output to MinIO at", remotePrefix);
    await uploadDirRecursive(producedDir, MINIO_BUCKET, remotePrefix);

    // upload thumbnail to thumbs/{videoId}.jpg
    const thumbRemote = path.posix.join("thumbs", `${videoId}.jpg`);
    await fPutFile(MINIO_BUCKET, thumbRemote, thumbFile);

    // update DB: add renditions metadata if you have a table; here we mark video ready and job completed
    try {
      await prisma.$transaction([
        prisma.video.update({ where: { id: videoId }, data: { status: "ready" } as any }),
        jobId ? prisma.job.update({ where: { id: typeof jobId === "string" ? Number(jobId) : (jobId as any) }, data: { status: "completed" } as any }) : (prisma as any).$queryRaw`select 1`,
      ]);
    } catch (e) {
      console.warn("DB update issue:", e);
    }

    console.log(`Transcode completed for video=${videoId}`);
  } catch (err) {
    console.error("Job failed:", err);
    try {
      await prisma.video.update({ where: { id: videoId }, data: { status: "failed" } as any });
      if (jobId) await prisma.job.update({ where: { id: typeof jobId === "string" ? Number(jobId) : (jobId as any) }, data: { status: "failed" } as any });
    } catch (e) {
      console.warn("Failed to mark DB entities as failed", e);
    }
    throw err;
  } finally {
    // cleanup
    try {
      await fs.rm(tmpBase, { recursive: true, force: true });
    } catch (e) {
      console.warn("cleanup failed:", e);
    }
  }
}

/** start worker */
const worker = new Worker(
  process.env.TRANSCODE_QUEUE || "transcode",
  async (job: Job) => {
    const data = job.data as TranscodeJobData;
    await handleJob(data);
  },
  {
    connection: redisClient,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 1),
  }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed`, err));

process.on("SIGINT", async () => {
  console.log("SIGINT, shutting down");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("SIGTERM, shutting down");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

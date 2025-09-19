import { Queue } from "bullmq";
import { Redis } from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
});

const queue = new Queue("transcodeQueue", { connection });

async function main() {
  const job = await queue.add("transcode", {
  jobId: 1,
  videoId: "test123",
  srcObjectKey: "uploads/originals/test.mp4",
});
  console.log("✅ Enqueued job:", job.id);
  await queue.close();
  await connection.quit();
}

main().catch(console.error);













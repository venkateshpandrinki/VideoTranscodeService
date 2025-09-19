import express from "express";
import dotenv from "dotenv";
import { config } from "./config.js";
import videosRouter from "./routes/videos.js";
import { prisma } from "./prisma.js";
import { transcodeQueue } from "./queue.js";
import cors from "cors";
import { ensureBucketExists } from "./utils/bucket-checker.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      
    ],
    credentials: true,
  })
);

app.use("/api/videos", videosRouter);

app.get("/ping", (_req, res) => res.send("pong"));
app.post("/auth/sync", async (req, res) => {
  const { email, name } = req.body

  if (!email) {
    return res.status(400).json({ error: "Email required" })
  }

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    })

    res.json(user)
  } catch (error) {
    console.error("Error syncing user:", error)
    res.status(500).json({ error: "Failed to sync user" })
  }
})



async function start() {
  await ensureBucketExists();
  app.listen(config.port, async () => {
    console.log(`API running on http://localhost:${config.port}`);
    try {
      // warm DB connection
      await prisma.$connect();
      console.log(" Prisma connected");
      // test redis by making a dummy call to the queue's client
      const redisClient = await transcodeQueue.client;
      await redisClient.ping();
      console.log("Redis (bullmq) reachable");
    } catch (e) {
      console.error("startup error:", e);
      process.exit(1);
    }
  });
}

start();

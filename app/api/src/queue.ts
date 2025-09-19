import { Queue } from "bullmq";
import { config } from "./config.js";

export const transcodeQueue = new Queue("transcode", {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

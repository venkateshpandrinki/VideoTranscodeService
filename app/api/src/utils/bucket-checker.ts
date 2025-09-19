import { minioClient, config } from "../config.js";

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(config.minio.bucket);
    if (!exists) {
      console.log(`Bucket "${config.minio.bucket}" does not exist. Creating...`);
      await minioClient.makeBucket(config.minio.bucket, "us-east-1");
      console.log(`✅ Bucket "${config.minio.bucket}" created`);
    } else {
      console.log(`✅ Bucket "${config.minio.bucket}" already exists`);
    }
  } catch (err: any) {
    console.error("❌ Failed to check/create bucket:", err.message);
    throw err;
  }
}

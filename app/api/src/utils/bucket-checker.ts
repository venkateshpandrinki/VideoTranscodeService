import { minioClient, config } from '../config.js';
import { logger } from './logger.js';

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(config.minio.bucket);
    if (!exists) {
      console.log(`Bucket "${config.minio.bucket}" does not exist. Creating...`);
      await minioClient.makeBucket(config.minio.bucket, 'us-east-1');
      console.log(`✅ Bucket "${config.minio.bucket}" created`);
    } else {
      console.log(`✅ Bucket "${config.minio.bucket}" already exists`);
    }
  } catch (err) {
    logger.error({ err: err }, 'Failed to create bucket');
    throw err;
  }
}

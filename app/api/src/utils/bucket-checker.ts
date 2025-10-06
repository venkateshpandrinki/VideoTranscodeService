import { minioClient, config } from '../config.js';
import { logger } from './logger.js';

export async function ensureBucketExists() {
  try {
    const bucketName = config.minio.bucket;
    const exists = await minioClient.bucketExists(bucketName);

    if (!exists) {
      console.log(`Bucket "${bucketName}" does not exist. Creating...`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket "${bucketName}" created`);
    } else {
      console.log(`✅ Bucket "${bucketName}" already exists`);
    }

    // Set public read policy
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    // Use setBucketPolicy with the builder as required in v8.x
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(` Public read policy applied to bucket "${bucketName}"`);
  } catch (err) {
    logger.error({ err }, 'Failed to ensure bucket or set policy');
    throw err;
  }
}

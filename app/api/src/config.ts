import dotenv from 'dotenv';
dotenv.config();
import { Client as MinioClient } from 'minio';

export const config = {
  port: process.env.PORT || 8080,

  postgres: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'videodb',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },

  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minio',
    secretKey: process.env.MINIO_SECRET_KEY || 'minio123',
    bucket: process.env.MINIO_BUCKET || 'videos',
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  publicHlsBaseUrl: process.env.PUBLIC_HLS_BASE_URL || 'http://localhost:8080',
  PUBLIC_MINIO_URL: process.env.PUBLIC_MINIO_URL || 'http://localhost',
};

export const minioClient = new MinioClient({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

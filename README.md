# Video Transcode Service

A production-ready, fully dockerized video streaming platform. This architecture handles high-volume video uploads, asynchronous HLS transcoding, and scalable delivery.

---

##  Architecture 


<img width="4005" height="1477" alt="image" src="https://github.com/user-attachments/assets/7704992d-e985-443d-b397-63f1ff6d14f8" />



---
## Tech Stack

| Component | Technology | Role |
| --- | --- | --- |
| **Frontend** | **Next.js** | UI, HLS Playback, Google OAuth |
| **API** | **Express.js** | Metadata management, Pre-signed URLs, Job publishing |
| **Storage** | **MinIO (S3)** | Raw video storage & processed HLS segment hosting |
| **Database** | **PostgreSQL** | User data, video metadata, and processing states |
| **Queue** | **Redis** | Pub/Sub messaging and Job Queue with **Dead Letter Queue** |
| **Transcoder** | **FFmpeg** | Worker service for HLS conversion and thumbnail generation |
| **Gateway** | **Nginx** | Reverse proxy and high-performance HLS delivery |

---

##  System Flow

1. **Direct Upload:** Next.js fetches a pre-signed URL from the API. The browser uploads the raw file directly to **MinIO**, bypassing backend buffering.
2. **Job Trigger:** The API stores metadata in **Postgres** and pushes a processing job to **Redis**.
3. **Transcoding:** An **FFmpeg worker** consumes the job, generates a `.m3u8` playlist and `.ts` segments, and saves the output back to MinIO.
4. **Delivery:** **Nginx** serves the HLS segments for adaptive bitrate streaming via the Next.js frontend.

---

##  Key Features

* **Asynchronous Processing:** Decoupled architecture ensures the API remains responsive while workers handle heavy transcoding.
* **Fault Tolerance:** Implemented **Dead Letter Queues (DLQ)** in Redis to handle and retry failed FFmpeg jobs.
* **Secure Storage:** Pre-signed URLs ensure only authenticated users can upload; internal services communicate via a private Docker network.
* **Production-Ready Docker:** Multi-stage builds for slim images, integrated health checks, and environment isolation.

---

##  Project Structure

* `/app/web`: Next.js frontend
* `/app/api`: Express API
* `/app/worker`: FFmpeg processing service
* `/infra`: Nginx and Docker configurations

---

## 🛠️ Local Development

```bash
# Start the entire stack
docker-compose up --build

```


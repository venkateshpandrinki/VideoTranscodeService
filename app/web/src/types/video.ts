export type VideoStatus = 'ready' | 'processing' | 'pending';

export interface Videotypes {
  id: string;
  title: string;
  description?: string;
  status: VideoStatus;
  storageBaseUri?: string;
  createdAt: string | Date;
}

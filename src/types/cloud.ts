/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CloudFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadTime: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface StorageConfig {
  provider: string;
  region: string;
  bucket: string;
  maxFileSize: number;
  allowedTypes: string[];
  autoCompress: boolean;
  quality: number;
  thumbnailSize: number;
}

export interface UploadResult {
  success: boolean;
  error?: string;
  file?: CloudFile;
}

export interface UploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}
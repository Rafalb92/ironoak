import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  ObjectStorage,
  PresignedUpload,
  StoredObject,
} from './object-storage.port';

const DEFAULT_UPLOAD_EXPIRY_SECONDS = 5 * 60;

export interface S3ObjectStorageConfig {
  bucket: string;
  /** public origin serving the bucket, e.g. an r2.dev subdomain or a CDN domain */
  publicBaseUrl: string;
}

/**
 * Adapter for any S3-compatible store: Cloudflare R2, AWS S3, MinIO.
 * The differences live in the S3Client configuration, not here.
 */
export class S3ObjectStorage implements ObjectStorage {
  private readonly publicBaseUrl: string;

  constructor(
    private readonly client: S3Client,
    private readonly config: S3ObjectStorageConfig,
  ) {
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/+$/, '');
  }

  async presignUpload({
    key,
    contentType,
    contentLength,
    expiresInSeconds = DEFAULT_UPLOAD_EXPIRY_SECONDS,
  }: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
      // signed headers must match exactly: a different type or size is rejected
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    return {
      key,
      url,
      headers: { 'Content-Type': contentType },
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async stat(key: string): Promise<StoredObject | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
      return {
        key,
        size: head.ContentLength ?? 0,
        contentType: head.ContentType ?? null,
      };
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async copy(sourceKey: string, targetKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.config.bucket,
        CopySource: `${this.config.bucket}/${encodeURI(sourceKey)}`,
        Key: targetKey,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}

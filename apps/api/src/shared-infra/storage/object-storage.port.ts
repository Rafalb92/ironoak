export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface PresignedUpload {
  key: string;
  url: string;
  /** headers the client must send with the PUT — they are part of the signature */
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface StoredObject {
  key: string;
  size: number;
  contentType: string | null;
}

/**
 * Generic object storage. Knows files and keys — nothing about products,
 * images or who may upload what. Those rules belong to the consuming context.
 */
export interface ObjectStorage {
  /**
   * Signed URL for a direct browser upload. Content type and exact length are
   * signed, so the client cannot upload a different type or a larger file.
   */
  presignUpload(params: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }): Promise<PresignedUpload>;

  /** metadata of a stored object, or null when it does not exist */
  stat(key: string): Promise<StoredObject | null>;

  copy(sourceKey: string, targetKey: string): Promise<void>;

  /** idempotent — deleting a missing key is not an error */
  delete(key: string): Promise<void>;

  publicUrl(key: string): string;
}

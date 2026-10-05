import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import {
  maxBytesFor,
  mediaTypeOf,
  type CreateMediaUploadInput,
  type ImageUploadTicket,
  type MediaType,
  type ProductMediaContentType,
} from '@ironoak/contracts';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../shared-infra/storage/object-storage.port';
import { ProductSchema } from './entities/product.entity';

const EXTENSIONS: Record<ProductMediaContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

// the bucket's lifecycle rule deletes everything under tmp/ after one day
const TMP_PREFIX = 'tmp/';
const UPLOAD_EXPIRY_SECONDS = 5 * 60;

export interface VerifiedUpload {
  key: string;
  type: MediaType;
}

/**
 * Catalog's rules for product media on top of generic object storage:
 * allowed types, size limits, key layout, and moving uploads out of tmp/.
 */
@Injectable()
export class ProductMediaService {
  private readonly logger = new Logger(ProductMediaService.name);

  constructor(
    private readonly em: EntityManager,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async createUploadTicket(
    productId: string,
    input: CreateMediaUploadInput,
  ): Promise<ImageUploadTicket> {
    const exists = await this.em.count(ProductSchema, { id: productId });
    if (!exists) throw new NotFoundException('Product not found');

    // the key is bound to the product — verification checks this prefix
    const key = `${TMP_PREFIX}products/${productId}/${randomUUID()}.${EXTENSIONS[input.contentType]}`;

    const upload = await this.storage.presignUpload({
      key,
      contentType: input.contentType,
      contentLength: input.size,
      expiresInSeconds: UPLOAD_EXPIRY_SECONDS,
    });

    return {
      uploadKey: upload.key,
      uploadUrl: upload.url,
      headers: upload.headers,
      expiresAt: upload.expiresAt,
    };
  }

  /**
   * Checks a completed upload without moving it. The type comes from what is
   * actually stored, not from what the client declared.
   */
  async verifyUpload(
    productId: string,
    uploadKey: string,
  ): Promise<VerifiedUpload> {
    const expectedPrefix = `${TMP_PREFIX}products/${productId}/`;
    if (!uploadKey.startsWith(expectedPrefix)) {
      throw new BadRequestException('Upload does not belong to this product');
    }

    const stored = await this.storage.stat(uploadKey);
    if (!stored) {
      throw new BadRequestException(
        'Upload not found — it has expired or was never completed',
      );
    }

    const type = mediaTypeOf(stored.contentType ?? '');
    if (!type || stored.size > maxBytesFor(type)) {
      await this.deleteQuietly(uploadKey);
      throw new BadRequestException(
        'Uploaded file is not an allowed image or video',
      );
    }

    return { key: uploadKey, type };
  }

  /** Moves a verified upload from tmp/ to permanent storage; returns the permanent key. */
  async promote(upload: VerifiedUpload): Promise<string> {
    const permanentKey = upload.key.slice(TMP_PREFIX.length);
    await this.storage.copy(upload.key, permanentKey);
    // the lifecycle rule would remove it anyway; deleting now keeps tmp/ small
    await this.deleteQuietly(upload.key);
    return permanentKey;
  }

  urlFor(image: { url?: string | null; storageKey?: string | null }): string {
    return image.storageKey
      ? this.storage.publicUrl(image.storageKey)
      : (image.url ?? '');
  }

  posterUrlFor(image: { posterKey?: string | null }): string | null {
    return image.posterKey ? this.storage.publicUrl(image.posterKey) : null;
  }

  /** Best effort: an orphaned file is harmless, a failing cleanup must not fail the caller. */
  async deleteQuietly(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not delete object ${key}: ${message}`);
    }
  }
}

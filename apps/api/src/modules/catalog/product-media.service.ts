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
  PRODUCT_IMAGE_CONTENT_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
  type CreateImageUploadInput,
  type ImageUploadTicket,
  type ProductImageContentType,
} from '@ironoak/contracts';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../shared-infra/storage/object-storage.port';
import { ProductSchema } from './entities/product.entity';

const EXTENSIONS: Record<ProductImageContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

// the bucket's lifecycle rule deletes everything under tmp/ after one day
const TMP_PREFIX = 'tmp/';
const UPLOAD_EXPIRY_SECONDS = 5 * 60;

/**
 * Catalog's rules for product media on top of generic object storage:
 * allowed types, size limit, key layout, and moving uploads out of tmp/.
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
    input: CreateImageUploadInput,
  ): Promise<ImageUploadTicket> {
    const exists = await this.em.count(ProductSchema, { id: productId });
    if (!exists) throw new NotFoundException('Product not found');

    // the key is bound to the product — registration checks this prefix
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
   * Verifies a completed upload and moves it from tmp/ to permanent storage.
   * Returns the permanent key.
   */
  async promoteUpload(productId: string, uploadKey: string): Promise<string> {
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

    // the signature already enforced type and size; check again, never trust the client path
    const allowedType = (
      PRODUCT_IMAGE_CONTENT_TYPES as readonly string[]
    ).includes(stored.contentType ?? '');
    if (!allowedType || stored.size > PRODUCT_IMAGE_MAX_BYTES) {
      await this.deleteQuietly(uploadKey);
      throw new BadRequestException('Uploaded file is not an allowed image');
    }

    const permanentKey = uploadKey.slice(TMP_PREFIX.length);
    await this.storage.copy(uploadKey, permanentKey);
    // the lifecycle rule would remove it anyway; deleting now keeps tmp/ small
    await this.deleteQuietly(uploadKey);

    return permanentKey;
  }

  urlFor(image: { url?: string | null; storageKey?: string | null }): string {
    return image.storageKey
      ? this.storage.publicUrl(image.storageKey)
      : (image.url ?? '');
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

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { OBJECT_STORAGE } from './object-storage.port';
import { S3ObjectStorage } from './s3-object-storage';

@Global()
@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      useFactory: (config: ConfigService) => {
        const client = new S3Client({
          // R2 requires a region value but ignores it; AWS needs the real region
          region: config.get<string>('STORAGE_REGION') ?? 'auto',
          // unset = AWS default endpoint; set for R2 or MinIO
          endpoint: config.get<string>('STORAGE_ENDPOINT'),
          credentials: {
            accessKeyId: config.getOrThrow<string>('STORAGE_ACCESS_KEY_ID'),
            secretAccessKey: config.getOrThrow<string>(
              'STORAGE_SECRET_ACCESS_KEY',
            ),
          },
          // AWS SDK >= 3.729 adds CRC32 checksums by default. A presigned PUT would
          // then carry the checksum of an empty body, and R2 rejects every upload.
          requestChecksumCalculation: 'WHEN_REQUIRED',
          responseChecksumValidation: 'WHEN_REQUIRED',
        });

        return new S3ObjectStorage(client, {
          bucket: config.getOrThrow<string>('STORAGE_BUCKET'),
          publicBaseUrl: config.getOrThrow<string>('STORAGE_PUBLIC_BASE_URL'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}

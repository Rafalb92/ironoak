import { imageUploadTicketSchema, maxBytesFor, mediaTypeOf } from '@ironoak/contracts';

export type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

class UploadAbortedError extends Error {
  constructor() {
    super('Upload cancelled');
  }
}

/** Same rules as the API — rejects before any byte is sent. */
export function validateMediaFile(
  file: File,
  { allowVideo = true }: { allowVideo?: boolean } = {},
): string | null {
  const type = mediaTypeOf(file.type);
  if (!type) return 'Use a JPEG, PNG, WebP or AVIF image, or an MP4 or WebM video.';
  if (type === 'VIDEO' && !allowVideo) return 'This product already has a video.';

  const max = maxBytesFor(type);
  if (file.size > max) {
    return `${type === 'VIDEO' ? 'Video' : 'Image'} must be ${max / 1024 / 1024} MB or smaller.`;
  }
  return null;
}

/**
 * PUT straight to object storage. XHR, not fetch: fetch has no upload progress
 * events. Deliberately not useApi — this request goes to R2, not to our API,
 * and must carry neither the API base URL nor session cookies.
 */
function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    // a CORS rejection surfaces here too, without a status code
    xhr.onerror = () => reject(new Error('Upload failed — network or CORS error'));
    xhr.onabort = () => reject(new UploadAbortedError());

    signal.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

export function useMediaUpload() {
  const api = useApi();

  const status = ref<UploadStatus>('idle');
  const progress = ref(0);
  const error = ref<string | null>(null);

  let controller: AbortController | null = null;
  let pending: Promise<string> | null = null;

  /** Starts uploading immediately; resolves with the upload key. */
  function start(
    productId: string,
    file: File,
    options: { allowVideo?: boolean } = {},
  ): Promise<string> {
    cancel();

    const validationError = validateMediaFile(file, options);
    if (validationError) {
      status.value = 'error';
      error.value = validationError;
      pending = Promise.reject(new Error(validationError));
      return pending;
    }

    const current = new AbortController();
    controller = current;
    const { signal } = current;

    status.value = 'uploading';
    progress.value = 0;
    error.value = null;

    pending = (async () => {
      const raw = await api(`/admin/products/${productId}/images/uploads`, {
        method: 'POST',
        body: { contentType: file.type, size: file.size },
        signal,
      });
      const ticket = imageUploadTicketSchema.parse(raw);

      await putWithProgress(
        ticket.uploadUrl,
        file,
        ticket.headers,
        (fraction) => {
          progress.value = fraction;
        },
        signal,
      );

      // a newer file may have replaced this one while it was uploading
      if (!signal.aborted) {
        status.value = 'uploaded';
        progress.value = 1;
      }
      return ticket.uploadKey;
    })().catch((cause: unknown) => {
      if (!signal.aborted && !(cause instanceof UploadAbortedError)) {
        status.value = 'error';
        error.value = cause instanceof Error ? cause.message : 'Upload failed';
      }
      throw cause;
    });

    return pending;
  }

  /** Waits for the current upload — used when the form is submitted mid-upload. */
  function result(): Promise<string> {
    return pending ?? Promise.reject(new Error('No file selected'));
  }

  function cancel() {
    controller?.abort();
    controller = null;
    pending = null;
    status.value = 'idle';
    progress.value = 0;
    error.value = null;
  }

  onScopeDispose(cancel);

  return { status, progress, error, start, result, cancel };
}

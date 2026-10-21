import { SetMetadata } from '@nestjs/common';

export const ALLOW_DEMO_KEY = 'allowDemo';

/**
 * Lets the demo admin perform this write. Writes are denied to DEMO_ADMIN by
 * default — every new admin endpoint is safe without remembering this marker.
 */
export const AllowDemo = () => SetMetadata(ALLOW_DEMO_KEY, true);

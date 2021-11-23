import { SetMetadata } from '@nestjs/common';
import { METADATA_KEY_AUTHORIZED } from './constants';

/**
 * 不需要权限
 */
export function NoAuth() {
  return SetMetadata(METADATA_KEY_AUTHORIZED, null);
}

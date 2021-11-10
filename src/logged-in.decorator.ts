import { UseGuards } from '@nestjs/common';
import { LoggedInGuard } from './logged-in.guard';

/**
 * 检查是否已登录
 *
 * 与@Authorized()和@CurrentUser({required: true})不同, @LoggedIn()只关心req.user是否有值,
 * 可以判断是否被其他guard授权的问题
 *
 * @see Authorized
 * @see CurrentUser
 */
export function LoggedIn() {
  return UseGuards(LoggedInGuard);
}

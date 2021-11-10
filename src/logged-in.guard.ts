import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { getRequestFromExecutionContext } from './utils';

/**
 * 检查是否登录
 *
 * 只判断req.user是否有值, 可以处理自定义方式登录的场景
 */
@Injectable()
export class LoggedInGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = getRequestFromExecutionContext(context);
    const user = req?.user;
    return !!user;
  }
}

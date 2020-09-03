/*
 * Created by Diluka on 2020-04-29.
 *
 *
 * ----------- 神 兽 佑 我 -----------
 *        ┏┓      ┏┓+ +
 *       ┏┛┻━━━━━━┛┻┓ + +
 *       ┃          ┃
 *       ┣     ━    ┃ ++ + + +
 *      ████━████   ┃+
 *       ┃          ┃ +
 *       ┃  ┴       ┃
 *       ┃          ┃ + +
 *       ┗━┓      ┏━┛  Code is far away from bug
 *         ┃      ┃       with the animal protecting
 *         ┃      ┃ + + + +
 *         ┃      ┃
 *         ┃      ┃ +
 *         ┃      ┃      +  +
 *         ┃      ┃    +
 *         ┃      ┗━━━┓ + +
 *         ┃          ┣┓
 *         ┃          ┏┛
 *         ┗┓┓┏━━━━┳┓┏┛ + + + +
 *          ┃┫┫    ┃┫┫
 *          ┗┻┛    ┗┻┛+ + + +
 * ----------- 永 无 BUG ------------
 */

import { Log } from '@nest-mods/log';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthOptionsProvider } from './auth-options.provider';
import { LOG_PREFIX } from './constants';
import { getRequestFromExecutionContext, resolveAny } from './utils';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  @Log(LOG_PREFIX) private logger: Logger;

  constructor(private options: AuthOptionsProvider) {
    super();
  }

  getRequest(context: ExecutionContext) {
    return getRequestFromExecutionContext(context);
  }

  async canActivate(context: ExecutionContext) {
    if (this.options.isDebug) {
      this.logger.debug(`try to authenticated by jwt`);
    }

    try {
      return await resolveAny(super.canActivate(context));
    } catch {
      if (this.options.isDebug) {
        this.logger.debug(`no jwt founded, skip`);
      }
    }
    return true;
  }
}

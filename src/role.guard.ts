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
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';

import { AuthOptionsProvider } from './auth-options.provider';
import { AuthService } from './auth.service';
import { METADATA_KEY_AUTHORIZED } from './constants';
import { getRequestFromExecutionContext } from './utils';

@Injectable()
export class RoleGuard implements CanActivate {

  private logger = new Logger('auth');

  constructor(private reflector: Reflector,
              private options: AuthOptionsProvider,
              private service: AuthService) {
  }

  canActivate(context: ExecutionContext) {
    const target = context.getClass();
    const method = context.getHandler();

    const roles = this.reflector.getAllAndOverride(METADATA_KEY_AUTHORIZED, [method, target]);
    const req = getRequestFromExecutionContext(context);
    const user = req?.user;

    if (this.options.isDebug) {
      this.logger.debug(`${user ? `${user.sub} with [${user.roles}]` : 'anonymous'} try to access ${target.name}#${method.name} ${_.isNil(roles) ? 'public' : `requires [${roles}]`}`);
    }

    return this.service.canAccess(user, roles);
  }
}

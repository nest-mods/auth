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

import { createParamDecorator, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { getRequestFromExecutionContext } from './utils';

export interface CurrentUserOptions {
  required?: boolean;
  cors?: boolean;
}

export function CurrentUser(options?: CurrentUserOptions): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    createParamDecorator((options: CurrentUserOptions, ctx: ExecutionContext) => {
      const req = getRequestFromExecutionContext(ctx);
      const user: Express.User = req?.user;
      if (options?.required && !user) {
        throw new UnauthorizedException('not logged in');
      }
      if (!user) return null;
      if (!user.isLocal && !options?.cors) {
        throw new ForbiddenException();
      }
      return user;
    })(options)(target, propertyKey, parameterIndex);
  };
}

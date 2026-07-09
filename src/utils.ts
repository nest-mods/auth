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

import { ExecutionContext } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';

export function getRequestFromExecutionContext<T = any>(context: ExecutionContext): T {
  switch (context.getType() as import('@nestjs/graphql').GqlContextType) {
    case 'graphql':
      return require('@nestjs/graphql').GqlExecutionContext.create(context).getContext()?.req as T;
    case 'http':
      return context.switchToHttp().getRequest<T>();
    default:
      throw new Error('Currently @nest-mods/auth doesn\'t support this context' + context.getType());
  }
}

export async function resolveAny<T = any>(target: Promise<T> | Observable<T> | T) {
  if (target instanceof Observable) {
    return lastValueFrom(target);
  }
  return target;
}

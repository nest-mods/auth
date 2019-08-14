/*
 * MIT License
 *
 * Copyright (c) 2019 nest-mods
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Log } from '@nest-mods/log';
import { ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_MODULE_OPTIONS, AuthActionType, LOG_PREFIX, METADATA_KEY_AUTH_ACTION } from '../constants';
import { AuthModuleOptions } from '../interfaces';
import { resolveAny } from '../util/resolve-any.util';

@Injectable()
export class AuthJwtGuard extends AuthGuard('jwt') {

  @Log(LOG_PREFIX) private logger: Logger;

  constructor(private readonly reflector: Reflector,
              @Inject(AUTH_MODULE_OPTIONS) private options: AuthModuleOptions) {
    super();
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    if (!this.options.useJwt) {
      this.logger.verbose('jwt auth not enabled');
      return true;
    }

    const jwtAuthConfig = this.options.jwtAuth;
    const authActionType = this.getMetadataByKey(context, METADATA_KEY_AUTH_ACTION) || jwtAuthConfig.defaultAuthAction;
    if (authActionType === AuthActionType.NO) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (request.user) {
      return true;
    }

    try {
      const result = await resolveAny<boolean>(super.canActivate(context));

      // this.logger.log({message: `jwt auth canActivate ${result}`, level: 'silly'});

      return result;
    } catch (e) {
      // this.logger.log({message: e.message, level: 'silly'});
      if (authActionType === AuthActionType.TRY) {
        return true;
      } else {
        throw e;
      }
    }

  }

  private getMetadataByKey<T>(context: ExecutionContext, key: string) {
    let data = this.reflector.get<T>(key, context.getHandler());

    if (data === undefined) {
      data = this.reflector.get<T>(key, context.getClass());
    }

    return data;
  }
}

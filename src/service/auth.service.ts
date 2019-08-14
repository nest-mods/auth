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
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { AUTH_MODULE_OPTIONS, LOG_PREFIX } from '../constants';
import { PasswordNotMatchException } from '../exception';
import { AuthModuleOptions, Payload, UserDetail, UserDetailService } from '../interfaces';

export enum AuthType {
  PASSWORD = 'PASSWORD',
}

@Injectable()
export class AuthService {

  @Log(LOG_PREFIX) private logger: Logger;

  private userService: UserDetailService;

  constructor(@Inject(AUTH_MODULE_OPTIONS) private options: AuthModuleOptions) {
    if (!options.service) {
      throw new Error('You MUST provide UserDetailService implement');
    }
    this.userService = options.service;
  }

  async issueToken(user: UserDetail, authType: AuthType = AuthType.PASSWORD) {
    this.logger.debug(`issueToken for ${user.username}`);
    const jwtConfig = this.options.jwtAuth;

    return jwt.sign({
      uid: user.id,
      sub: user.username,
      roles: user.roles,
      authType,
    }, jwtConfig.secret, jwtConfig.signOptions);
  }

  async verifyByPass(username: string, password: string) {
    this.logger.debug(`verifyByPass for ${username}`);
    const user = await this.userService.loadByUsername(username);

    const pass = await this.userService.verifyPassword(user, password);

    if (!pass) {
      if (_.isFunction(this.userService.loginFailed)) {
        await this.userService.loginFailed(user);
      }
      throw new PasswordNotMatchException();
    }

    if (_.isFunction(this.userService.loginSuccessful)) {
      await this.userService.loginSuccessful(user);
    }

    return user;
  }

  async verifyByJwtUser(payload: Payload) {
    this.logger.debug(`verifyByJwtUser for ${payload.sub}`);
    const user = await this.userService.loadByUsername(payload.sub);

    if (_.isFunction(this.userService.verifyJwtSuccessful)) {
      await this.userService.verifyJwtSuccessful(user);
    }

    return user;
  }

}

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
import { DynamicModule, Global, LoggerService, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as _ from 'lodash';
import { AUTH_MODULE_OPTIONS, AuthActionType } from './constants';
import { AuthBasicGuard } from './guard/auth-basic.guard';
import { AuthJwtGuard } from './guard/auth-jwt.guard';
import { RoleAclGuard } from './guard/role-acl.guard';
import { AuthModuleAsyncOptions, AuthModuleOptions } from './interfaces';
import { AuthService } from './service/auth.service';
import { BasicStrategy } from './strategy/basic.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';

const defaultAuthConfig: Partial<AuthModuleOptions> = {
  useJwt: true,
  useBasic: true,
  useACL: true,
  basicAuth: {
    defaultAuthAction: AuthActionType.TRY,
  },
  jwtAuth: {
    defaultAuthAction: AuthActionType.TRY,
    queryTokenKey: 'token',
    secret: 'DEFAULT_PASSWORD',
    signOptions: {
      expiresIn: '7d',
      audience: 'demo',
      issuer: 'demo',
    },
  },
};

@Global()
@Module({
  providers: [AuthService, JwtStrategy, BasicStrategy, {
    provide: APP_GUARD,
    useClass: AuthBasicGuard,
  }, {
    provide: APP_GUARD,
    useClass: AuthJwtGuard,
  }, {
    provide: APP_GUARD,
    useClass: RoleAclGuard,
  }],
  exports: [AuthService],
})
export class AuthModule {
  @Log() private static logger: LoggerService;

  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      imports: options.imports,
      providers: [{
        provide: AUTH_MODULE_OPTIONS,
        inject: options.inject,
        useFactory: async (...args) => {
          const opts = await options.useFactory(...args);
          return _.defaultsDeep(opts, defaultAuthConfig);
        },
      }],
    };
  }
}

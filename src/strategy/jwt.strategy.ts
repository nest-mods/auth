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

import { ExtractJwt, Strategy as HttpJwtStrategy } from 'passport-jwt';
import { AuthService } from '../service/auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { AuthModuleOptions, Callback, Payload, UserDetail } from '../interfaces';
import { AUTH_MODULE_OPTIONS } from '../constants';
import { Log } from '@nest-mods/log';

@Injectable()
export class JwtStrategy extends PassportStrategy(HttpJwtStrategy) {

  @Log() private logger: LoggerService;

  constructor(private readonly authService: AuthService,
              @Inject(AUTH_MODULE_OPTIONS) private options: AuthModuleOptions) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter(options.jwtAuth.queryTokenKey),
      ]),
      secretOrKey: options.jwtAuth.secret,
      issuer: options.jwtAuth.signOptions.issuer,
      audience: options.jwtAuth.signOptions.audience,
      passReqToCallback: false,
    });
  }

  async validate(payload: Payload, done: Callback<UserDetail>) {
    this.logger.log({ message: 'validate', payload, level: 'debug' });
    try {
      const user = await this.authService.verifyByJwtUser(payload);
      done(null, user);
    } catch (e) {
      done(e);
    }
  }
}

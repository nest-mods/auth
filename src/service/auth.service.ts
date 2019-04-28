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

import * as jwt from "jsonwebtoken";
import { forwardRef, Inject, Injectable, LoggerService } from "@nestjs/common";
import { AuthModuleOptions, Payload, UserDetail } from "../interfaces";
import { AUTH_MODULE_OPTIONS } from "../constants";
import { Log } from "@nest-mods/log";
import { UserDetailService } from "./user-detail.service";
import { PasswordNotMatchException } from "../exception";

export enum AuthType {
  PASSWORD = "PASSWORD",
}

@Injectable()
export class AuthService {

  @Log() private logger: LoggerService;

  constructor(@Inject(AUTH_MODULE_OPTIONS) private options: AuthModuleOptions,
              @Inject(forwardRef(() => UserDetailService)) private userService: UserDetailService) {
  }

  async issueToken(user: UserDetail, authType: AuthType = AuthType.PASSWORD) {
    this.logger.log({ message: `issueToken for ${user.username}`, level: "debug" });
    const jwtConfig = this.options.jwtAuth;

    return jwt.sign({
      uid: user.id,
      sub: user.username,
      roles: user.roles,
      authType
    }, jwtConfig.secret, jwtConfig.signOptions);
  }

  async verifyByPass(username: string, password: string) {
    this.logger.log({ message: `verifyByPass for ${username}`, level: "debug" });
    const user = await this.userService.loadByUsername(username);

    const pass = await this.userService.verifyPassword(user, password);

    if (!pass) {
      await this.userService.loginFailed(user);
      throw new PasswordNotMatchException();
    }

    await this.userService.loginSuccessful(user);

    return user;
  }

  async verifyByJwtUser(payload: Payload) {
    this.logger.log({ message: `verifyByJwtUser for ${payload.sub}`, level: "debug" });
    const user = await this.userService.loadByUsername(payload.sub);

    return user;
  }

}

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

import { CanActivate, ExecutionContext, Inject, Injectable, LoggerService, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AUTH_MODULE_OPTIONS, AuthActionType, METADATA_KEY_AUTH_ACTION, METADATA_KEY_AUTHORIZED } from "../constants";
import * as _ from "lodash";
import { Log } from "@nest-mods/log";
import { AuthModuleOptions } from "../interfaces";

@Injectable()
export class RoleAclGuard implements CanActivate {

  @Log() private logger: LoggerService;

  constructor(private readonly reflector: Reflector,
              @Inject(AUTH_MODULE_OPTIONS) private options: AuthModuleOptions) {
  }

  async canActivate(
    context: ExecutionContext
  ) {

    if (!this.options.useACL) {
      this.logger.log({ message: "ACL not enabled", level: "silly" });
      return true;
    }

    if (this.getMetadataByKey(context, METADATA_KEY_AUTH_ACTION) === AuthActionType.NO) {
      return true;
    }

    const allowedRoles = this.getMetadataByKey<string[]>(context, METADATA_KEY_AUTHORIZED);

    // 没有@Authorized
    if (_.isUndefined(allowedRoles)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("Please login");
    }

    // @Authorized() 不限制角色
    if (_.isEmpty(allowedRoles)) {
      return true;
    }

    // this.logger.log({
    //     message: 'check roles',
    //     id: user.id,
    //     username: user.username,
    //     roles: user.roles,
    //     allowedRoles,
    //     level: 'silly'
    // });

    // super user has all access
    if (!_.isNil(this.options.superUserId) && this.options.superUserId === user.id) {
      return true;
    }

    return (user.roles || []).some(role => (allowedRoles as any).includes(role));

  }

  private getMetadataByKey<T>(context: ExecutionContext, key: string) {

    let data = this.reflector.get<T>(key, context.getHandler());

    if (data === undefined) {
      data = this.reflector.get<T>(key, context.getClass());
    }

    return data;
  }
}

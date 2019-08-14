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

import { ModuleMetadata } from '@nestjs/common/interfaces';
import { SignOptions } from 'jsonwebtoken';
import { AuthActionType } from './constants';

export interface UserDetail {
  id?: number;
  username: string;
  roles: string[];
  lastChangedAt: Date;
}

export interface UserDetailService<T extends UserDetail = UserDetail> {
  loadByUsername(username: string): Promise<T>;

  verifyPassword(user: T, raw: string): Promise<boolean>;

  loginSuccessful?(user: T): Promise<void>;

  verifyJwtSuccessful?(user: T): Promise<void>;

  loginFailed?(user: T): Promise<void>;
}

export interface AuthModuleOptions {
  useJwt?: boolean;
  useBasic?: boolean;
  useACL?: boolean;
  /**
   * @deprecated
   */
  superUserId?: number;
  bypassUser?: (user: UserDetail) => Promise<boolean> | boolean;
  service: UserDetailService,
  basicAuth?: {
    defaultAuthAction?: AuthActionType,
  };
  jwtAuth?: {
    defaultAuthAction?: AuthActionType,
    queryTokenKey?: string,
    secret?: string,
    signOptions?: SignOptions,
  };
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: any[];
  enabledController?: boolean;
}

export type Callback<T = any> = (error: Error | null, data?: T) => void;

export interface Payload {
  uid: string;
  sub: string;
  roles: string[];
  authType: string;
  iat: number;
  exp: number;
  nbf?: number;
  jti?: string;
  iss: string;
  aud: string;
}

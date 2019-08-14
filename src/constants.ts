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

export const AUTH_MODULE_ID = '70C84D42-c0E9-d88C-F1ed-cBbeB6Ef1108';

export const AUTH_MODULE_OPTIONS = `${AUTH_MODULE_ID}:options`;

export const METADATA_KEY_AUTHORIZED = `${AUTH_MODULE_ID}:METADATA_KEY:Authorized`;
export const METADATA_KEY_AUTH_ACTION = `${AUTH_MODULE_ID}:METADATA_KEY:AuthAction`;

export const LOG_PREFIX = 'auth';

export enum AuthActionType {
  /**
   * 无需认证
   */
  NO = 'NO',
  /**
   * 尝试性认证，如果认证失败将不会抛出异常，认证成功user将挂在至 req.user
   */
  TRY = 'TRY',
  /**
   * 硬性认证，如果认证失败将抛出异常UnauthorizedException
   */
  REQUIRE = 'REQUIRE',
}

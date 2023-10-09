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

import type { ModuleMetadata } from '@nestjs/common/interfaces';
import type { Redis, RedisOptions } from 'ioredis';

declare global {
  namespace Express {
    // tslint:disable-next-line:no-empty-interface
    export interface User extends Pick<AuthUser, 'uid' | 'sub' | 'roles' | 'isLocal'>, Record<string, any> {
    }

    export interface Request {
      user?: User;
    }
  }
}

export type LoadUserBySubFn = (sub: string, type?: string) => Promise<AuthUserWithCredential> | AuthUserWithCredential;
export type UidType = string | number;
export type OnValidatedFn = (user: AuthUser | AuthJwtUser, strategy: string) => Promise<any>;

export interface AuthModuleOptions {
  secret: string;
  thisApp: string;
  forApps: string[];
  expiresIn: string | number;
  session?: boolean;
  su?: string;
  suRoles?: string[];
  ignoreJti?: boolean;
  redis?: Redis | RedisOptions;
  loadUserBySub?: LoadUserBySubFn;
  passwordEncoder?: IPasswordEncoder;
  onValidated?: OnValidatedFn;
  debug?: boolean;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: any[];
}

export interface AuthUser extends Record<string, any> {
  uid: UidType;
  sub: string;
  roles: string[];

  /**
   * issued by self
   */
  isLocal?: boolean;
}

export interface AuthUserWithCredential extends AuthUser {
  password?: string;
}

export interface AuthJwtUser extends Omit<AuthUser, 'username'> {
  /**
   * Issuer
   */
  iss: string;
  /**
   * Subject
   */
  sub: string;
  /**
   * Audience
   */
  aud: string;
  /**
   * Expiration Time
   */
  exp: number;
  /**
   * Not Before
   */
  nbf?: number;
  /**
   * Issued At
   */
  iat: number;
  /**
   * JWT ID
   */
  jti: string;
}

export interface IPasswordEncoder {
  encode(rawPassword: string): string;

  matches(rawPassword: string, encodedPassword: string): boolean;
}

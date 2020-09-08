import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import * as _ from 'lodash';
import * as uuid from 'uuid';

import { AuthOptionsProvider } from './auth-options.provider';
import { AuthJwtUser, AuthUser, AuthUserWithCredential, UidType } from './interfaces';

@Injectable()
export class AuthService {

  private logger = new Logger('auth');

  constructor(private jwtService: JwtService,
              private options: AuthOptionsProvider) {
  }

  async issueJwt(authUser: AuthUser | AuthUserWithCredential, options?: SignOptions) {
    const { password, ...payload } = authUser;
    const jwtid = uuid.v4();
    const token = this.jwtService.sign(payload, { ...options, jwtid });

    await this.saveJti(token);

    return token;
  }

  async login(sub: string, password?: string, type?: string): Promise<AuthUser> {
    if (this.options.isDebug) {
      this.logger.debug(`login ${sub}`);
    }

    const user = await this.options.loadUserBySub(sub, type);

    if (this.options.isDebug) {
      this.logger.verbose('loaded user:');
      this.logger.verbose(user);

      this.logger.verbose(`using password: ${!!password}`);
      this.logger.verbose(`user set password: ${!!user?.password}`);
    }

    let pass = true;
    if (!user) {
      pass = false;
    }

    // 尝试使用密码登录未设置密码的用户算失败
    if (pass && password && !user.password) {
      pass = false;
    }

    // 仅在使用密码的前提下判断
    if (pass && !_.isNil(password)) {
      pass = this.options.passwordEncoder.matches(password, user.password);
    }

    if (!pass) {
      throw new UnauthorizedException('username or password not match');
    }

    return user;
  }

  canAccess(user: AuthUser, roles: string[]) {
    if (_.isNil(roles)) {
      return true;
    }

    if (!user) {
      throw new UnauthorizedException();
    }

    if (this.isSuperUser(user)) {
      if (this.options.isDebug) {
        this.logger.debug(`superuser access granted: ${user.sub}`);
      }
      return true;
    }

    if (_.isEmpty(roles)) {
      return true;
    }

    return this.hasAnyRole(user, roles);
  }

  async validateJwt(user: AuthJwtUser): Promise<AuthJwtUser> {
    user.isLocal = user.iss === this.options.thisApp;
    if (!this.options.isIgnoreJTI && user.isLocal) {
      const { uid, jti } = user;
      await this.checkJti(uid, jti);
    }
    return user;
  }

  async invalidJwtByJti(jti: string) {
    const redisClient = this.getRC();
    if (redisClient) {
      const keys = await redisClient.keys(`JWT:*:${jti}`);
      if (!_.isEmpty(keys)) {
        await redisClient.unlink(keys);
      }
    }
  }

  async invalidJwtByUid(uid: UidType) {
    const redisClient = this.getRC();
    if (redisClient) {
      const keys = await redisClient.keys(`JWT:${uid}:*`);
      if (!_.isEmpty(keys)) {
        await redisClient.unlink(keys);
      }
    }
  }

  isSuperUser(user: AuthUser) {
    return user?.sub === this.options.superUserSub;
  }

  hasAnyRole(user: AuthUser, roles: string[]) {
    return user?.roles.some(o => roles.includes(o));
  }

  private async saveJti(token: string) {
    const redisClient = this.getRC();
    if (redisClient) {
      const { uid, exp, jti } = this.jwtService.decode(token) as AuthJwtUser;
      const key = `JWT:${uid}:${jti}`;
      await redisClient.multi()
        .set(key, 'OK')
        .expireat(key, exp)
        .exec();
    }
  }

  private async checkJti(uid: UidType, jti: string) {
    const redisClient = this.getRC();
    if (redisClient) {
      const exist = await redisClient.exists(`JWT:${uid}:${jti}`);
      if (!exist) {
        throw new UnauthorizedException();
      }
    }
  }

  private getRC() {
    return this.options.redis;
  }
}

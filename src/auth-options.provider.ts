import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { AuthOptionsFactory, IAuthModuleOptions } from '@nestjs/passport';
import * as _ from 'lodash';
import { ExtractJwt, StrategyOptions } from 'passport-jwt';
import { LOG_PREFIX } from './constants';
import { AuthModuleOptions } from './interfaces';
import { NoopPasswordEncoder } from './noop-password-encoder';

@Injectable()
export class AuthOptionsProvider implements AuthOptionsFactory, JwtOptionsFactory {

  @Log(LOG_PREFIX) private logger: Logger;

  constructor(private options: AuthModuleOptions) {
  }

  get superUserSub() {
    return this.options.su;
  }

  get isIgnoreJTI() {
    return !!this.options.ignoreJti;
  }

  get jtiStoreDB() {
    return this.options.jtiStoreDB;
  }

  get loadUserBySub() {
    if (!this.options.loadUserBySub) {
      throw new Error('No loadUserBySub provided');
    }
    return this.options.loadUserBySub;
  }

  get thisApp() {
    return this.options.thisApp;
  }

  get passwordEncoder() {
    if (!this.options.passwordEncoder) {
      this.logger.warn(`using default NoopPasswordEncoder`);
      this.options.passwordEncoder = new NoopPasswordEncoder();
    }
    return this.options.passwordEncoder;
  }

  get isDebug() {
    return this.options.debug;
  }

  createAuthOptions(): IAuthModuleOptions {
    return {
      session: this.options.session,
    };
  }

  createJwtOptions(): JwtModuleOptions {
    return {
      secret: this.options.secret,
      signOptions: {
        issuer: this.options.thisApp,
        audience: this.options.forApps,
        expiresIn: this.options.expiresIn,
      },
      verifyOptions: {
        audience: this.options.thisApp,
      },
    };
  }

  createJwtStrategyOptions(): StrategyOptions {
    return {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: this.options.secret,
      audience: this.options.thisApp,
    };
  }

  get onValidated() {
    if (!_.isFunction(this.options.onValidated)) {
      this.options.onValidated = () => Promise.resolve();
    }
    return this.options.onValidated;
  }
}

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
import { Log } from '@nest-mods/log';
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { AuthOptionsProvider } from './auth-options.provider';
import { AuthService } from './auth.service';
import { LOG_PREFIX } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  @Log(LOG_PREFIX) private logger: Logger;

  constructor(private options: AuthOptionsProvider, private service: AuthService) {
    super(options.createJwtStrategyOptions());
  }

  async validate(payload) {
    if (this.options.isDebug) {
      this.logger.verbose('jwt payload:');
      this.logger.verbose(payload);
    }
    const user = await this.service.validateJwt(payload);
    this.options.onValidated(user, 'jwt').catch(e => {
      if (this.options.isDebug) {
        this.logger.warn(e.message);
        this.logger.verbose(e);
      }
    });
    return user;
  }
}

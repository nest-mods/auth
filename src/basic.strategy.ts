/*
 * Created by Diluka on 2020/6/12.
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
import { BasicStrategy as HttpBasicStrategy } from 'passport-http';

import { AuthOptionsProvider } from './auth-options.provider';
import { AuthService } from './auth.service';
import { LOG_PREFIX } from './constants';

@Injectable()
export class BasicStrategy extends PassportStrategy(HttpBasicStrategy) {

  @Log(LOG_PREFIX) private logger: Logger;

  constructor(private authService: AuthService,
              private options: AuthOptionsProvider) {
    super();
  }

  async validate(username: string, password: string, done: (err, user?) => void) {
    try {
      const user = await this.authService.login(username, password, 'basic');
      user.isLocal = true;
      this.options.onValidated(user, 'basic').catch(e => {
        if (this.options.isDebug) {
          this.logger.warn(e.message);
          this.logger.verbose(e);
        }
      });
      done(null, user);
    } catch (e) {
      done(e);
    }
  }
}

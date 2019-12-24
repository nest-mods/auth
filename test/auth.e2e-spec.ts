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

/*
 * Created by Diluka on 2019-02-26.
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

import { LogModule } from '@nest-mods/log';
import { Body, Controller, Get, HttpCode, HttpStatus, INestApplication, Injectable, Logger, Module, Post, Req, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsNotEmpty } from 'class-validator';
import * as request from 'supertest';
import { AuthModule, Authorized, AuthService, CurrentUser, NoAuth, UserDetail, UserDetailService } from '../src';

class LoginReq {
  @IsNotEmpty()
  username: string;
  @IsNotEmpty()
  password: string;
}

@Controller('auth')
class AuthController {

  constructor(private authService: AuthService) {
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Req() req: any, @Body(new ValidationPipe()) form: LoginReq) {
    logger.debug(`${form.username} is logging in`);
    const user = await this.authService.verifyByPass(form.username, form.password, req);
    const token = await this.authService.issueToken(user);
    return { token };
  }

  @Authorized()
  @Get('me')
  async me(@CurrentUser({ required: true }) user: UserDetail) {
    logger.verbose({ message: 'me', user });
    return user;
  }

}

@Authorized('A')
@Controller('tests')
class TestController {

  @NoAuth()
  @Get()
  forEveryone() {
    return true;
  }

  @Get('a')
  forA() {
    return true;
  }

  @Get('ab')
  @Authorized(['A', 'B'])
  forAnB() {
    return true;
  }

  @Authorized('B')
  @Get('b')
  forB() {
    return true;
  }

  @Get('c')
  @Authorized('C')
  forC() {
    return true;
  }
}

@Controller('test2')
class Test2Controller {
  @Get()
  forEveryone() {
    return true;
  }

  @Authorized()
  @Get('need-login')
  needLogin() {
    return true;
  }
}

class User implements UserDetail {
  id: number;
  lastChangedAt: Date;
  roles: string[];
  username: string;
}

@Injectable()
class UserService implements UserDetailService {
  async loadByUsername(username: string): Promise<User> {
    logger.log(`loadByUsername ${username}`);
    const user = new User();
    user.id = username === 'su' ? 1 : 2;
    user.username = username;
    user.roles = ['A', 'B'];
    user.lastChangedAt = new Date();
    logger.log({
      message: 'mock user',
      user,
      level: 'silly',
    });
    return user;
  }

  async verifyPassword(user: User, raw: string, req?: any): Promise<boolean> {
    const isPassed = raw === 'test';
    if (isPassed) {
      await this.loginSuccessful(user, req);
    } else {
      await this.loginFailed(user);
    }
    return isPassed;
  }

  async loginSuccessful(user: User, req?: any) {
    logger.log(`loginSuccessful ${user.username}%${req?.ip}`);
  }

  async loginFailed(user: User) {
    logger.log(`loginFailed ${user.username}`);
  }
}

@Module({
  providers: [UserService],
  controllers: [TestController, Test2Controller, AuthController],
  exports: [UserService],
})
class DemoModule {
}

const logger = new Logger('AuthModule Tests');
jest.setTimeout(1000000);
describe('AuthModule Tests', function() {

  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        LogModule,
        DemoModule,
        AuthModule.forRootAsync({
          useFactory: (service) => ({
            service,
            bypassUser: user => user.id === 1,
          }),
          inject: [UserService],
          imports: [DemoModule],
        })],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test' });

    token = res.body.token;

    logger.log({ message: 'login', token, level: 'debug' });
  });

  it('should access a', async () => {
    await request(app.getHttpServer())
      .get('/tests/a')
      .auth(token, { type: 'bearer' })
      .expect(200);
  });

  it('should access b', async () => {
    await request(app.getHttpServer())
      .get('/tests/b')
      .auth('test', 'test')
      .expect(200);
  });

  it('should access ab', async () => {
    await request(app.getHttpServer())
      .get('/tests/ab')
      .auth(token, { type: 'bearer' })
      .expect(200);
  });

  it('should not access c', async () => {
    await request(app.getHttpServer())
      .get('/tests/c')
      .auth(token, { type: 'bearer' })
      .expect(403);
  });

  it('should require login', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('should access by everyone', async () => {
    await request(app.getHttpServer())
      .get('/tests/')
      .expect(200);

    await request(app.getHttpServer())
      .get('/tests/')
      .auth(token, { type: 'bearer' })
      .expect(200);
  });

  it('should su access', async () => {
    await request(app.getHttpServer())
      .get('/tests/c')
      .auth('su', 'test')
      .expect(200);
  });

  it('should not access with wrong pass', async () => {
    await request(app.getHttpServer())
      .get('/tests/b')
      .auth('test', 'test1')
      .expect(401);
  });

  it('should access a public route', async () => {
    await request(app.getHttpServer())
      .get('/test2/')
      .expect(200);
  });

  it('should not access without login', async () => {
    await request(app.getHttpServer())
      .get('/test2/need-login')
      .expect(401);
  });

  it('should access with login', async () => {
    await request(app.getHttpServer())
      .get('/test2/need-login')
      .auth('test', 'test')
      .expect(200);
  });
});

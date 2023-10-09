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

import { Body, Controller, Get, HttpCode, HttpStatus, INestApplication, Logger, Module, Post, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthModule, Authorized, AuthService, CurrentUser, LoggedIn } from '../src';
import { NoAuth } from '../src/no-auth.decorator';

const logger = new Logger('AuthModule Tests');

// <editor-fold desc="TL:DR">
class LoginReq {
  username: string;
  password: string;
}

@Controller('auth')
class AuthController {

  constructor(private authService: AuthService) {
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Req() req: any, @Body() form: LoginReq) {
    logger.debug(`${form.username} is logging in`);
    const user = await this.authService.login(form.username, form.password);
    const token = await this.authService.issueJwt(user);
    logger.verbose('login:');
    logger.verbose(token);
    return { token };
  }

  @Authorized()
  @Get('me')
  async me(@CurrentUser({ required: true }) user: Express.User) {
    logger.verbose('me:');
    logger.verbose(user);
    return user;
  }

}

@Authorized('A')
@Controller('tests')
class TestController {

  @Get('a')
  forA() {
    return true;
  }

  @Get('ab')
  @Authorized('A', 'B')
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

  @NoAuth()
  @Get('no-auth')
  forNoAuth() {
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

  @LoggedIn()
  @Get('need-login2')
  needLogin2() {
    return true;
  }
}

@Module({
  controllers: [TestController, Test2Controller, AuthController],
})
class DemoModule {
}

// </editor-fold>

describe('AuthModule Tests', function() {

  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DemoModule,
        AuthModule.forRootAsync({
          useFactory: () => ({
            secret: 'demo',
            su: 'su',
            suRoles: ['SU'],
            thisApp: 'demo',
            forApps: ['demo'],
            expiresIn: '7d',
            loadUserBySub: (sub) => ({
              uid: 0,
              sub,
              password: 'test',
              roles: ['A', 'B', sub === 'su-role' ? 'SU' : 'U'],
            }),
            debug: true,
          }),
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  }, 100000);
  afterAll(() => app.close());

  beforeEach(async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test' });

    token = res.body.token;

    logger.debug('POST /auth/login');
    logger.debug(token);
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

  it('should su access', async () => {
    await request(app.getHttpServer())
      .get('/tests/c')
      .auth('su', 'test')
      .expect(200);
  });

  it('should su role access', async () => {
    await request(app.getHttpServer())
      .get('/tests/c')
      .auth('su-role', 'test')
      .expect(200);
  });

  it('should not access with wrong pass', async () => {
    await request(app.getHttpServer())
      .get('/tests/b')
      .auth('test', 'test1')
      .expect(401);
  });

  it('should access without auth', async () => {
    await request(app.getHttpServer())
      .get('/tests/no-auth')
      .expect(200);
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

  it('should access with login2', async () => {
    await request(app.getHttpServer())
      .get('/test2/need-login2')
      .auth('test', 'test')
      .expect(200);
  });
});

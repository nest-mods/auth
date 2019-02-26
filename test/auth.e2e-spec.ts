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

import {Controller, Get, INestApplication, Injectable, Logger} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AuthModule, UserDetail, UserDetailService} from '../src';
import {Authorized} from '../src/decorator/authorized.decorator';
import * as request from 'supertest';
import {NoAuth} from '../src/decorator/no-auth.decorator';

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

class User implements UserDetail {
    id: number;
    lastChangedAt: Date;
    roles: string[];
    username: string;
}

@Injectable()
class UserService extends UserDetailService {
    async loadByUsername(username: string): Promise<User> {
        logger.log(`loadByUsername ${username}`);
        const user = new User();
        user.id = 1;
        user.username = username;
        user.roles = ['A', 'B'];
        user.lastChangedAt = new Date();
        return user;
    }

    async verifyPassword(user: User, raw: string): Promise<boolean> {
        return true;
    }
}

const logger = new Logger('AuthModule Tests');

describe('AuthModule Tests', function() {

    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [AuthModule.forRootAsync({
                useFactory: () => ({}),
                UserDetailService: UserService,
                enabledController: true,
            })],
            providers: [UserService],
            exports: [UserService],
            controllers: [TestController],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    beforeEach(async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({username: 'test', password: 'test'});

        token = res.body.token;

        logger.log({message: 'login', token, level: 'debug'});
    });

    it('should access a', async () => {
        await request(app.getHttpServer())
            .get('/tests/a')
            .auth(token, {type: 'bearer'})
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
            .auth(token, {type: 'bearer'})
            .expect(200);
    });

    it('should not access c', async () => {
        await request(app.getHttpServer())
            .get('/tests/c')
            .auth(token, {type: 'bearer'})
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
            .auth(token, {type: 'bearer'})
            .expect(200);
    });
});

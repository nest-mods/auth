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

import {Body, Controller, Get, LoggerService, Post, ValidationPipe} from '@nestjs/common';
import {AuthService} from '../service/auth.service';
import {Authorized, CurrentUser, NoAuth} from '../decorator';
import {UserDetail} from '../interfaces';
import {LoginDto} from '../dto/login.dto';
import {Log} from '@nest-mods/log';
import {setSwaggerOperation, setSwaggerUseTags} from '@nest-mods/swagger-helper';

@Controller('auth')
export class AuthController {

    @Log() private logger: LoggerService;

    constructor(private authService: AuthService) {
    }

    @NoAuth()
    @Post('login')
    async login(@Body(new ValidationPipe()) form: LoginDto) {
        this.logger.log({message: `${form.username} is logging in`, level: 'debug'});
        const user = await this.authService.verifyByPass(form.username, form.password);
        const token = await this.authService.issueToken(user);
        return {token};
    }

    @Authorized()
    @Get('me')
    async me(@CurrentUser({required: true}) user: UserDetail) {
        this.logger.log({message: 'me', user, level: 'silly'});
        return user;
    }

}

setSwaggerUseTags(AuthController, '@nest-mods/auth');
setSwaggerOperation(AuthController.prototype.login, {summary: 'login', description: 'login for a jwt token'});
setSwaggerOperation(AuthController.prototype.me, {summary: 'current user info', description: 'get current user info'});

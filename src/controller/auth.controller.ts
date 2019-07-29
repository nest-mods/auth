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

import { Log } from "@nest-mods/log";
import { SwaggerDecorators } from "@nest-mods/swagger-helper";
import { Body, Controller, Get, HttpCode, HttpStatus, LoggerService, Post, ValidationPipe } from "@nestjs/common";
import { Authorized, CurrentUser, NoAuth } from "../decorator";
import { IssuedTokenDto } from "../dto/issued-token.dto";
import { LoginDto } from "../dto/login.dto";
import { UserDetailDto } from "../dto/user-detail.dto";
import { UserDetail } from "../interfaces";
import { AuthService } from "../service/auth.service";
import ApiOkResponse = SwaggerDecorators.ApiOkResponse;
import ApiOperation = SwaggerDecorators.ApiOperation;
import ApiUseTags = SwaggerDecorators.ApiUseTags;

@ApiUseTags("@nest-mods/auth")
@Controller("auth")
export class AuthController {

  @Log() private logger: LoggerService;

  constructor(private authService: AuthService) {
  }

  @ApiOperation({ title: "login", description: "login for a jwt token" })
  @ApiOkResponse({ type: IssuedTokenDto, description: "issued jwt token" })
  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body(new ValidationPipe()) form: LoginDto) {
    this.logger.log({ message: `${form.username} is logging in`, level: "debug" });
    const user = await this.authService.verifyByPass(form.username, form.password);
    const token = await this.authService.issueToken(user);
    return { token };
  }

  @ApiOperation({ title: "current user info", description: "get current user info" })
  @ApiOkResponse({ type: UserDetailDto, description: "partial current user" })
  @Authorized()
  @Get("me")
  async me(@CurrentUser({ required: true }) user: UserDetail) {
    this.logger.log({ message: "me", user, level: "silly" });
    return user;
  }

}

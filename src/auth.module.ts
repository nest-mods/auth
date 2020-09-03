import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthOptionsProvider } from './auth-options.provider';
import { AuthService } from './auth.service';
import { BasicAuthGuard } from './basic-auth.guard';
import { BasicStrategy } from './basic.strategy';
import { AuthModuleAsyncOptions } from './interfaces';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RoleGuard } from './role.guard';

@Global()
@Module({
  imports: [
    PassportModule.registerAsync({ useExisting: AuthOptionsProvider }),
    JwtModule.registerAsync({ useExisting: AuthOptionsProvider }),
  ],
  providers: [
    AuthService, JwtStrategy, BasicStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: BasicAuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      imports: options.imports,
      providers: [
        {
          provide: AuthOptionsProvider,
          useFactory: async (...args: any[]) => {
            return new AuthOptionsProvider(await options.useFactory(...args));
          },
          inject: options.inject,
        },
      ],
      exports: [AuthOptionsProvider],
    };
  }
}

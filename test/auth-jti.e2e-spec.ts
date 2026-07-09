import { Controller, Get, INestApplication, Module, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import request from 'supertest';

import { AuthModule } from '../src/auth.module';
import { AuthOptionsProvider } from '../src/auth-options.provider';
import { AuthService } from '../src/auth.service';
import { Authorized } from '../src/authorized.decorator';
import { CurrentUser } from '../src/current-user.decorator';
import { AuthJwtUser, UidType } from '../src/interfaces';

const jwtService = new JwtService();

function jtiKey(jti: string) {
  return `JWT:JTI:${jti}`;
}

function uidKey(uid: UidType) {
  return `JWT:UID:${uid}`;
}

function newUid() {
  return `auth-jti-test-${randomUUID()}`;
}

@Controller('jti-auth')
class JtiAuthController {
  @Authorized()
  @Get('me')
  me(@CurrentUser({ required: true }) user: Express.User) {
    return {
      uid: user.uid,
      sub: user.sub,
    };
  }
}

@Module({
  controllers: [JtiAuthController],
})
class JtiAuthTestModule {
}

function createAuthService(redis: Redis) {
  return new AuthService(
    new JwtService({
      secret: 'demo',
      signOptions: {
        issuer: 'demo',
        audience: ['demo'],
        expiresIn: '7d',
      },
      verifyOptions: {
        audience: 'demo',
      },
    }),
    new AuthOptionsProvider({
      secret: 'demo',
      thisApp: 'demo',
      forApps: ['demo'],
      expiresIn: '7d',
      redis,
    }),
  );
}

describe('AuthService JWT JTI storage', () => {
  let redis: Redis;
  let app: INestApplication;
  let service: AuthService;
  const issuedTokens: string[] = [];

  beforeAll(async () => {
    redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
      lazyConnect: true,
      connectTimeout: 1000,
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
    });
    redis.on('error', () => undefined);
    await redis.connect();
    await redis.ping();
    service = createAuthService(redis);

    const module = await Test.createTestingModule({
      imports: [
        JtiAuthTestModule,
        AuthModule.forRootAsync({
          useFactory: () => ({
            secret: 'demo',
            thisApp: 'demo',
            forApps: ['demo'],
            expiresIn: '7d',
            redis,
          }),
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    const keys = issuedTokens.flatMap(token => {
      const { uid, jti } = jwtService.decode(token) as AuthJwtUser;
      return [jtiKey(jti), uidKey(uid)];
    });
    issuedTokens.length = 0;
    if (keys.length > 0) {
      await redis.unlink([...new Set(keys)]);
    }
  });

  afterAll(async () => {
    await app.close();
    await redis.quit();
  });

  async function issueTestJwt(uid = newUid()) {
    const token = await service.issueJwt({
      uid,
      sub: 'test',
      roles: ['A'],
    });
    issuedTokens.push(token);
    return {
      token,
      payload: jwtService.decode(token) as AuthJwtUser,
    };
  }

  it('should save jti and uid indexes without the legacy token key when issuing a jwt', async () => {
    const {
      payload: { uid, jti },
    } = await issueTestJwt();

    expect(await redis.get(jtiKey(jti))).toBe(String(uid));
    expect(await redis.smembers(uidKey(uid))).toEqual([jti]);
    expect(await redis.ttl(jtiKey(jti))).toBeGreaterThan(0);
    expect(await redis.ttl(uidKey(uid))).toBeGreaterThan(0);
  });

  it('should validate jwt by the jti index', async () => {
    const {
      token,
      payload: { uid, jti },
    } = await issueTestJwt();

    await expect(service.decodeJwt(token)).resolves.toMatchObject({ uid, jti });

    await redis.unlink(jtiKey(jti));

    await expect(service.decodeJwt(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should remove jti and uid indexes when invalidating by jti', async () => {
    const {
      payload: { uid, jti },
    } = await issueTestJwt();

    await service.invalidJwtByJti(jti);

    expect(await redis.exists(jtiKey(jti))).toBe(0);
    expect(await redis.sismember(uidKey(uid), jti)).toBe(0);
  });

  it('should remove all jti indexes when invalidating by uid', async () => {
    const uid = newUid();
    const {
      payload: { jti: jti1 },
    } = await issueTestJwt(uid);
    const {
      payload: { jti: jti2 },
    } = await issueTestJwt(uid);

    await expect(redis.get(jtiKey(jti1))).resolves.toBe(String(uid));
    await expect(redis.get(jtiKey(jti2))).resolves.toBe(String(uid));
    await expect(redis.smembers(uidKey(uid))).resolves.toEqual(expect.arrayContaining([jti1, jti2]));

    await service.invalidJwtByUid(uid);

    expect(await redis.exists(jtiKey(jti1))).toBe(0);
    expect(await redis.exists(jtiKey(jti2))).toBe(0);
    expect(await redis.exists(uidKey(uid))).toBe(0);
  });

  it('should return 401 when accessing an endpoint with an invalidated jwt', async () => {
    const {
      token,
      payload: { jti },
    } = await issueTestJwt();

    await request(app.getHttpServer())
    .get('/jti-auth/me')
    .auth(token, { type: 'bearer' })
    .expect(200);

    await service.invalidJwtByJti(jti);

    await request(app.getHttpServer())
    .get('/jti-auth/me')
    .auth(token, { type: 'bearer' })
    .expect(401);
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

import { AuthOptionsProvider } from '../src/auth-options.provider';
import { AuthService } from '../src/auth.service';
import { AuthJwtUser, UidType } from '../src/interfaces';

const jwtService = new JwtService();

function tokenKey(uid: UidType, jti: string) {
  return `JWT:${uid}:${jti}`;
}

function jtiKey(jti: string) {
  return `JWT:JTI:${jti}`;
}

function uidKey(uid: UidType) {
  return `JWT:UID:${uid}`;
}

function newUid() {
  return `auth-jti-test-${randomUUID()}`;
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
  });

  afterEach(async () => {
    const keys = issuedTokens.flatMap(token => {
      const { uid, jti } = jwtService.decode(token) as AuthJwtUser;
      return [tokenKey(uid, jti), jtiKey(jti), uidKey(uid)];
    });
    issuedTokens.length = 0;
    if (keys.length > 0) {
      await redis.unlink([...new Set(keys)]);
    }
  });

  afterAll(async () => {
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

  it('should save token, jti, and uid indexes when issuing a jwt', async () => {
    const {
      payload: { uid, jti },
    } = await issueTestJwt();

    expect(await redis.get(tokenKey(uid, jti))).toBe('OK');
    expect(await redis.get(jtiKey(jti))).toBe(String(uid));
    expect(await redis.smembers(uidKey(uid))).toEqual([jti]);
    expect(await redis.ttl(tokenKey(uid, jti))).toBeGreaterThan(0);
    expect(await redis.ttl(jtiKey(jti))).toBeGreaterThan(0);
    expect(await redis.ttl(uidKey(uid))).toBeGreaterThan(0);
  });

  it('should still validate jwt by the token jti key', async () => {
    const {
      token,
      payload: { uid, jti },
    } = await issueTestJwt();

    await expect(service.decodeJwt(token)).resolves.toMatchObject({ uid, jti });

    await redis.unlink(tokenKey(uid, jti));

    await expect(service.decodeJwt(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should remove token and indexes when invalidating by jti', async () => {
    const {
      payload: { uid, jti },
    } = await issueTestJwt();

    await service.invalidJwtByJti(jti);

    expect(await redis.exists(tokenKey(uid, jti))).toBe(0);
    expect(await redis.exists(jtiKey(jti))).toBe(0);
    expect(await redis.sismember(uidKey(uid), jti)).toBe(0);
  });

  it('should remove all token and jti indexes when invalidating by uid', async () => {
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

    expect(await redis.exists(tokenKey(uid, jti1))).toBe(0);
    expect(await redis.exists(tokenKey(uid, jti2))).toBe(0);
    expect(await redis.exists(jtiKey(jti1))).toBe(0);
    expect(await redis.exists(jtiKey(jti2))).toBe(0);
    expect(await redis.exists(uidKey(uid))).toBe(0);
  });
});

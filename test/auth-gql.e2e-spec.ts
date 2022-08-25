import { ApolloDriver } from '@nestjs/apollo';
import { INestApplication, Logger, Module } from '@nestjs/common';
import { Args, ArgsType, Field, GraphQLModule, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import gql from 'graphql-tag';
import { AuthModule, Authorized, AuthService, CurrentUser, LoggedIn, NoAuth } from '../src';
import { createTestGraphqlClient, GQLClient } from './util/create-test-graphql-client';

const logger = new Logger('AuthModule Tests for GraphQL');

// <editor-fold desc="TL:DR">
@ArgsType()
class LoginArgs {
  @Field()
  username: string;
  @Field()
  password: string;
}

@Resolver()
class AuthResolver {
  constructor(private authService: AuthService) {
  }

  @Mutation(() => String)
  async login(@Args() { username, password }: LoginArgs) {
    const user = await this.authService.login(username, password);
    const token = await this.authService.issueJwt(user);
    logger.verbose('login:');
    logger.verbose(token);
    return token;
  }

  @Authorized()
  @Query(() => String)
  async me(@CurrentUser({ required: true }) user: Express.User) {
    logger.verbose('me:');
    logger.verbose(user);
    return user.sub;
  }
}

@Authorized('A')
@Resolver()
class Test1Resolver {
  @Query(() => Boolean)
  forA() {
    return true;
  }

  @Query(() => Boolean)
  @Authorized('A', 'B')
  forAnB() {
    return true;
  }

  @Authorized('B')
  @Query(() => Boolean)
  forB() {
    return true;
  }

  @Query(() => Boolean)
  @Authorized('C')
  forC() {
    return true;
  }

  @NoAuth()
  @Query(() => Boolean)
  forNoAuth() {
    return true;
  }
}

@Resolver()
class Test2Resolver {
  @Query(() => Boolean)
  forEveryone() {
    return true;
  }

  @Authorized()
  @Query(() => Boolean)
  needLogin() {
    return true;
  }

  @LoggedIn()
  @Query(() => Boolean)
  needLogin2() {
    return true;
  }
}

@Module({
  providers: [AuthResolver, Test1Resolver, Test2Resolver],
})
class DemoModule {
}

// </editor-fold>

describe('AuthModule Tests for GraphQL', () => {
  let app: INestApplication;
  let client: GQLClient;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DemoModule,
        GraphQLModule.forRoot({
          driver: ApolloDriver,
          autoSchemaFile: 'test/schema.graphql',
          playground: false,
          debug: true,
        }),
        AuthModule.forRootAsync({
          useFactory: () => ({
            secret: 'demo',
            su: 'su',
            thisApp: 'demo',
            forApps: ['demo'],
            expiresIn: '7d',
            loadUserBySub: (sub) => ({
              uid: 0,
              sub,
              password: 'test',
              roles: ['A', 'B'],
            }),
            debug: true,
          }),
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    client = createTestGraphqlClient(app);
  }, 100000);
  afterAll(() => app.close());

  beforeEach(async () => {
    const {
      body: {
        data: { login },
      },
    } = await client(
      gql`
          mutation ($username: String!, $password: String!) {
              login(username: $username, password: $password)
          }
      `,
      { username: 'test', password: 'test' },
    ).expect(200);

    logger.debug('mutation login:');
    logger.debug(login);

    token = login;
  });

  it('should access a', async () => {
    const { body } = await client(gql`
        query {
            forA
        }
    `)
    .auth(token, { type: 'bearer' })
    .expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should access b', async () => {
    const { body } = await client(gql`
        query {
            forB
        }
    `)
    .auth(token, { type: 'bearer' })
    .expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should access ab', async () => {
    const { body } = await client(gql`
        query {
            forAnB
        }
    `)
    .auth(token, { type: 'bearer' })
    .expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should not access c', async () => {
    const { body } = await client(gql`
        query {
            forC
        }
    `)
    .auth(token, { type: 'bearer' })
    .expect(200);

    expect(body).toHaveProperty('errors');
    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
  });

  it('should require login', async () => {
    const { body } = await client(gql`
        query {
            me
        }
    `)
    .auth(token, { type: 'bearer' })
    .expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should su access', async () => {
    const { body } = await client(gql`
        query {
            forC
        }
    `)
    .auth('su', 'test')
    .expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should not access with wrong pass', async () => {
    const { body } = await client(gql`
        query {
            forB
        }
    `)
    .auth('test', 'test1')
    .expect(200);

    expect(body).toHaveProperty('errors');
    expect(body.errors[0].extensions.code).toEqual('UNAUTHENTICATED');
  });

  it('should access without auth', async () => {
    const { body } = await client(gql`
        query {
            forNoAuth
        }
    `).expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should access a public route', async () => {
    const { body } = await client(gql`
        query {
            forEveryone
        }
    `).expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should not access without login', async () => {
    const { body } = await client(gql`
        query {
            needLogin
        }
    `).expect(200);

    expect(body).toHaveProperty('errors');
    expect(body.errors[0].extensions.code).toEqual('UNAUTHENTICATED');
  });

  it('should access with login', async () => {
    const { body } = await client(gql`
        query {
            needLogin
        }
    `)
    .auth('test', 'test')
    .expect(200);

    expect(body).not.toHaveProperty('errors');
  });

  it('should access with login2', async () => {
    const { body } = await client(gql`
        query {
            needLogin2
        }
    `)
    .auth('test', 'test')
    .expect(200);

    expect(body).not.toHaveProperty('errors');
  });
});

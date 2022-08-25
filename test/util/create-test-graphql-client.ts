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

import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { DocumentNode, print } from 'graphql';
import * as supertest from 'supertest';

export type GQLClient = (doc: DocumentNode, variables?: any) => supertest.Test;

export function createTestGraphqlClient(app: INestApplication): GQLClient {
  const $ = supertest(app.getHttpServer());
  const m: any = app.get(GraphQLModule);
  const path = m._graphQlAdapter._apolloServer.graphqlPath;
  return (doc: DocumentNode, variables?: any) => $.post(path).send({ variables, query: print(doc) });
}

//apps\api\src\common\clients\apollo.client.ts
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
} from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const createApolloClient = (config: { wsUri: string; httpUri: string }) => {
  const httpLink = new HttpLink({
    uri: config.httpUri,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const wsLink = new WebSocketLink({
    uri: config.wsUri,
    options: {
      reconnect: true
    }
  });

  return new ApolloClient({
    link: split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    ),
    cache: new InMemoryCache(),
  });
};

// Bot Client
export const botClient = createApolloClient({
  wsUri: `ws://${process.env.API_URL}/graphql`,
  httpUri: `${process.env.API_URL}/graphql`
});

// Dashboard Client (Browser)
const client = new ApolloClient({
  uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
  cache: new InMemoryCache()
});
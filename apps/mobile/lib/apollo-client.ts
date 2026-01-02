import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Get GraphQL endpoint from environment variables
const GRAPHQL_HTTP_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GRAPHQL_HTTP_URL ||
  process.env.EXPO_PUBLIC_GRAPHQL_HTTP_URL ||
  'http://localhost:4000/graphql';

console.log('🌐 GraphQL URL:', GRAPHQL_HTTP_URL);
console.log('🔧 Expo Config Extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
console.log('🔧 Process Env GRAPHQL_HTTP_URL:', process.env.EXPO_PUBLIC_GRAPHQL_HTTP_URL);

// HTTP link for GraphQL requests
const httpLink = new HttpLink({
  uri: GRAPHQL_HTTP_URL,
});

// Auth link to attach JWT token to requests
const authLink = setContext(async (_, { headers }) => {
  try {
    // Get access token from SecureStore
    const token = await SecureStore.getItemAsync('accessToken');

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { headers };
  }
});

// Error link to handle authentication errors and token refresh
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Handle authentication errors
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        console.log('Unauthenticated error, token may need refresh');
        // Token refresh will be handled by authStore
        // For now, just log the error
      }
    }
  }

  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
  }
});

// Create Apollo Client instance
export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Feed pagination
          feed: {
            keyArgs: false,
            merge(existing = [], incoming, { args }) {
              // If offset is 0, replace existing (refresh)
              if (args?.offset === 0) return incoming;
              // Otherwise append (load more)
              return [...existing, ...incoming];
            },
          },
          // Messages pagination
          messages: {
            keyArgs: ['conversationId'],
            merge(existing = [], incoming, { args }) {
              if (args?.offset === 0) return incoming;
              return [...existing, ...incoming];
            },
          },
          // Notifications pagination
          notifications: {
            keyArgs: false,
            merge(existing = [], incoming, { args }) {
              if (args?.offset === 0) return incoming;
              return [...existing, ...incoming];
            },
          },
          // Events pagination
          events: {
            keyArgs: ['orgId'],
            merge(existing = [], incoming, { args }) {
              if (args?.offset === 0) return incoming;
              return [...existing, ...incoming];
            },
          },
          // Organizations pagination
          organizations: {
            keyArgs: ['filter'],
            merge(existing = [], incoming, { args }) {
              if (args?.offset === 0) return incoming;
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

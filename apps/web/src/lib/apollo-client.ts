import { ApolloClient, InMemoryCache, HttpLink, split, ApolloLink } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql',
})

const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
        connectionParams: () => {
          const token = localStorage.getItem('token')
          return {
            authorization: token ? `Bearer ${token}` : '',
          }
        },
      })
    )
  : null

const authLink = new ApolloLink((operation, forward) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => {
    // Don't overwrite if authorization header already exists (e.g., passed in context)
    const existingAuth = headers?.authorization || headers?.Authorization

    return {
      headers: {
        ...headers,
        authorization: existingAuth || (token ? `Bearer ${token}` : ''),
      },
    }
  })

  return forward(operation)
})

const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      authLink.concat(httpLink)
    )
  : authLink.concat(httpLink)

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const graphqlUrl = "https://esic.ganpatiinfosolutions.com/graphql";

export function createApolloClient(token) {
  return new ApolloClient({
    link: new HttpLink({
      uri: graphqlUrl,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),
    cache: new InMemoryCache(),
  });
}

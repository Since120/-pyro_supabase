import { ApolloClient, InMemoryCache, HttpLink, split, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
	throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

// Detailliertes Fehler-Logging ohne Änderung der Funktionalität
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
	if (graphQLErrors) {
		graphQLErrors.forEach((err, index) => {
			console.error(`[GraphQL Error ${index}]:`, err);
			console.error('Operation:', operation.operationName);
		});
	}
	if (networkError) {
		console.error('[Network Error]:', networkError);
	}
	
	return forward(operation);
});

// HTTP Link unverändert
const httpLink = new HttpLink({
	uri: `${apiUrl}/graphql`,
});

// Kritische Änderung hier: Konfiguration des WebSocket-Links
const wsLink = new GraphQLWsLink(
	createClient({
		url: apiUrl.replace(/^http/, 'ws') + '/graphql',
		connectionParams: {
			timeout: 30000, // Reduzieren Sie den Timeout auf 30 Sekunden
		},
		on: {
			connected: () => {
				console.log('WebSocket connected to GraphQL endpoint');
				// Optional: Setzen Sie einen globalen Status, dass die Verbindung hergestellt wurde
			},
			connecting: () => console.log('Connecting to GraphQL WebSocket...'),
			closed: (event) => {
				console.log('WebSocket connection closed', event);
				// Optional: Setzen Sie einen globalen Status, dass die Verbindung geschlossen wurde
			},
			error: (error) => {
				console.error('WebSocket connection error:', error);
				// Zeigen Sie detailliertere Fehlerinformationen
				console.error('Error details:', JSON.stringify(error, null, 2));
			},
		},
		retryAttempts: 5,           // Reduzieren Sie die Anzahl der Wiederholungsversuche
		shouldRetry: () => true,
		connectionAckWaitTimeout: 10000, // Reduzieren Sie auf 10 Sekunden
		lazy: false,                // Sofortige Verbindung, nicht lazy
		keepAlive: 10000,           // 10 Sekunden Ping-Intervall
	})
);

// Split Link unverändert
const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
	},
	wsLink,
	httpLink
);

// Apollo-Client mit originalem Cache und Optionen
const client = new ApolloClient({
	link: from([errorLink, splitLink]),
	cache: new InMemoryCache(),
	connectToDevTools: process.env.NODE_ENV !== 'production',
	defaultOptions: {
		watchQuery: {
			fetchPolicy: 'cache-and-network',
			errorPolicy: 'all',
		},
		query: {
			fetchPolicy: 'network-only',
			errorPolicy: 'all',
		},
		mutate: {
			errorPolicy: 'all',
		}
	},
});

export default client;
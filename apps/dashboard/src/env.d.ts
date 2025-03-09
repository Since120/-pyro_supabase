export interface Env {
	// App
	NEXT_PUBLIC_APP_URL?: string;
	NEXT_PUBLIC_VERCEL_URL?: string;
	NEXT_PUBLIC_LOG_LEVEL?: string;
	NEXT_PUBLIC_AUTH_STRATEGY?: string;

	// Auth0
	AUTH0_DOMAIN?: string;
	AUTH0_CLIENT_ID?: string;
	AUTH0_CLIENT_SECRET?: string;
	AUTH0_SECRET?: string;
	NEXT_PUBLIC_PROFILE_ROUTE?: string;
	NEXT_PUBLIC_ACCESS_TOKEN_ROUTE?: string;

	// Cognito
	COGNITO_CLIENT_SECRET?: string;
	NEXT_PUBLIC_COGNITO_AUTHORITY?: string;
	NEXT_PUBLIC_COGNITO_DOMAIN?: string;
	NEXT_PUBLIC_COGNITO_CLIENT_ID?: string;

	// Supabase
	NEXT_PUBLIC_SUPABASE_URL?: string;
	NEXT_PUBLIC_SUPABASE_PUBLIC_KEY?: string;

	// Mapbox
	NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?: string;

	// Google Tag Manager
	NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?: string;
}

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Env {}
	}
}

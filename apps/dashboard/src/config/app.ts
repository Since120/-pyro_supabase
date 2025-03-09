import { AuthStrategy } from '@/lib/auth-strategy';
import { LogLevel } from '@/lib/logger';
import type { PrimaryColor } from '@/styles/theme/types';

export interface AppConfig {
	name: string;
	description: string;
	// Overriden by Settings Context.
	direction: 'ltr' | 'rtl';
	// Overriden by Settings Context.
	language: string;
	// Overriden by Settings Context.
	theme: 'light' | 'dark' | 'system';
	themeColor: string;
	// Overriden by Settings Context.
	primaryColor: PrimaryColor;
	logLevel: keyof typeof LogLevel;
	authStrategy: keyof typeof AuthStrategy;
}

export const appConfig: AppConfig = {
	name: 'Devias Kit Pro',
	description: '',
	direction: 'ltr',
	language: 'en',
	theme: 'light',
	themeColor: '#090a0b',
	primaryColor: 'neonBlue',
	logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel) || LogLevel.ALL,
	authStrategy: (process.env.NEXT_PUBLIC_AUTH_STRATEGY as keyof typeof AuthStrategy) || AuthStrategy.NONE,
};

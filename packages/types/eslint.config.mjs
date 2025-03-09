// packages/types/eslint.config.mjs
import { createRequire } from 'node:module';

import baseConfig from '../../eslint.config.mjs';

const require = createRequire(import.meta.url);

export default [
	...baseConfig,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			// Verwende hier den require-Wrapper:
			parser: require('@typescript-eslint/parser'),
			parserOptions: {
				project: './tsconfig.json',
			},
		},
	},
];

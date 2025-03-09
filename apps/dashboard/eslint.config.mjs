// apps/dashboard/eslint.config.mjs

import { createRequire } from 'node:module';

import { FlatCompat } from '@eslint/eslintrc';

import baseConfig from '../../eslint.config.mjs';

const require = createRequire(import.meta.url);
const compat = new FlatCompat();

export default [
	// Zuerst alle Basis-Regeln:
	...baseConfig,

	// Dashboard-spezifische Einstellungen:
	{
		files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
		settings: {
			'import/resolver': {
				typescript: true,
				node: true,
				alias: {
					map: [['@', './src']],
					extensions: ['.js', '.jsx'],
				},
			},
			react: { version: 'detect' },
		},
		plugins: {
			react: require('eslint-plugin-react'),
			unicorn: require('eslint-plugin-unicorn'),
			'react-hooks': require('eslint-plugin-react-hooks'),
			next: require('@next/eslint-plugin-next'),
			import: require('eslint-plugin-import'),
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					ignoreRestSiblings: true,
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-empty-object-type': 'off',
			'unicorn/prevent-abbreviations': 'off',
			'unicorn/no-null': 'off',
			'unicorn/no-nested-ternary': 'off',
			'unicorn/no-array-reduce': 'off',
			'react/prop-types': 'off',
			'prettier/prettier': 'off',
			'unicorn/consistent-function-scoping': 'off',
			'unicorn/prefer-top-level-await': 'off',
			'unicorn/prefer-global-this': 'off',
			'no-unused-disable-directives': 'off',
		},
	},

	// Die erweiterten Konfigurationen als eigenständige Array-Elemente:
	...compat.extends('plugin:react-hooks/recommended'),
	...compat.config(require('@next/eslint-plugin-next').configs.recommended),

	// Spezifisches Override für TS/TSX-Dateien:
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: require('@typescript-eslint/parser'),
			parserOptions: {
				project: './tsconfig.json',
			},
		},
	},
];

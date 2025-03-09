/** @type {import('prettier').Config} */
const basePrettierConfig = {
	endOfLine: 'lf',
	printWidth: 120,
	semi: true,
	singleQuote: true, // hier geändert von false zu true
	tabWidth: 2,
	trailingComma: 'es5',
	useTabs: true,
	importOrder: [
		'^node:$',
		'',
		'^(react/(.*)$)|^(react$)',
		'^(next/(.*)$)|^(next$)',
		'<THIRD_PARTY_MODULES>',
		'',
		'^@/types$',
		'^@/types/(.*)$',
		'^@/config$',
		'^@/config/(.*)$',
		'^@/paths$',
		'^@/data/(.*)$',
		'^@/lib/(.*)$',
		'^@/locales/(.*)$',
		'^@/actions/(.*)$',
		'^@/contexts/(.*)$',
		'^@/hooks/(.*)$',
		'^@/components/(.*)$',
		'^@/styles/(.*)$',
		'',
		'^[./]',
	],
	plugins: ['@ianvs/prettier-plugin-sort-imports'],
};

export default basePrettierConfig;

// eslint.config.mjs (im Projektroot)

// 1. Benötigte Module importieren
import { createRequire } from 'node:module'; // Für Import von CommonJS-Modulen in ESM

import js from '@eslint/js'; // ESLint Kernempfehlungen (ESLint 9 Flat Config)
import eslintConfigPrettier from 'eslint-config-prettier'; // Prettier: deaktiviert konfliktende Regeln
import tseslint from 'typescript-eslint'; // TypeScript-Parser & -Plugin (Flat Config Helfer)

// Einige Plugins liefern ihre empfohlene Konfig als CommonJS (z.B. eslint-plugin-prettier).
// Mit createRequire können wir in ESM 'require' nutzen, um solche Module einzubinden:
const require = createRequire(import.meta.url);
// eslint-plugin-prettier's Flat-Config-Empfehlung (aktiviert Prettier als Regel & config-prettier)
const prettierRecommended = require('eslint-plugin-prettier/recommended');

// 2. Konfiguration exportieren (Flat Config Array)
export default [
	// Globale Ignore-Patterns (anstelle von .eslintignore)
	{
		ignores: [
			'**/node_modules/**', // Node-Modules im Monorepo ignorieren
			'**/dist/**', // Build-/Dist-Ordner ignorieren (ggf. anpassen)
			'**/build/**',
			'**/.next/**', // .next-Ordner ignorieren (wichtig für Next.js-Generierte Dateien)
		],
	},

	// Globale Spracheinstellungen und Umgebungen
	{
		languageOptions: {
			ecmaVersion: 'latest', // modernste ECMAScript-Syntax unterstützen (Node 22)
			sourceType: 'module', // Standard: ES Module Syntax
			globals: {
				// Node globale Variablen erlauben (z.B. __dirname, process)
				...(await import('globals')).node,
			},
		},
	},

	// ESLint empfohlene Grundregeln für JavaScript:
	js.configs.recommended,

	// TypeScript-spezifische Regeln und Parser-Einstellungen:
	...tseslint.configs.recommended,

	// Prettier-Konfiguration einbinden:
	eslintConfigPrettier,
	prettierRecommended,
];

// config.ts
import * as path from 'path';

import * as dotenv from 'dotenv';

const isProduction: boolean = process.env.NODE_ENV === 'production';

const envFilePath: string = isProduction
	? path.resolve(__dirname, '../.env') // apps/dashboard/.env
	: path.resolve(__dirname, '../../../.env'); // Monorepo-Root

dotenv.config({ path: envFilePath });
console.log(`Environment variables loaded from: ${envFilePath}`);

// Bei rein clientseitiger Verwendung -> NEXT_PUBLIC_API_URL
// oder, falls du es lieber als API_URL definieren willst:
// export const DASHBOARD_API_URL = process.env.API_URL || "http://localhost:3002";

export const DASHBOARD_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const DASHBOARD_LOG_LEVEL = process.env.LOG_LEVEL || 'info';

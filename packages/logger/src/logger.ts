// packages/logger/src/logger.ts
import { createLogger, format, Logger, transports } from 'winston';

import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = format;

// Definiere ein Format, das Datum, Log-Level und Nachricht (inklusive Fehlerstapel) anzeigt
const myFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} [${level}]: ${stack || message}`;
});

// Erstelle den Logger mit dem Log-Level "debug"
const logger: Logger = createLogger({
	level: 'debug',
	format: combine(
		timestamp(),
		errors({ stack: true }), // Fehlerstapel einfügen
		myFormat
	),
	transports: [
		// Konsolen-Transport (farbig)
		new transports.Console({
			format: combine(colorize(), timestamp(), errors({ stack: true }), myFormat),
		}),
		// Tägliche Datei-Rotation
		new transports.DailyRotateFile({
			filename: 'logs/application-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
		}),
	],
	exitOnError: false, // Verhindere, dass der Logger bei einem Fehler die Anwendung beendet
});

export default logger;

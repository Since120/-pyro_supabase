'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const winston_1 = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf, colorize, errors } = winston_1.format;
const myFormat = printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} [${level}]: ${stack || message}`;
});
const logger = (0, winston_1.createLogger)({
	level: 'debug',
	format: combine(timestamp(), errors({ stack: true }), myFormat),
	transports: [
		new winston_1.transports.Console({
			format: combine(colorize(), timestamp(), errors({ stack: true }), myFormat),
		}),
		new winston_1.transports.DailyRotateFile({
			filename: 'logs/application-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
		}),
	],
	exitOnError: false,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map

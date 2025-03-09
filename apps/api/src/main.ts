//apps\api\src\main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@nestjs/common';
import { AppModule } from './app.module';
import { URL } from 'url';
import winstonLogger from 'pyro-logger';
import { AllExceptionsFilter } from './common/filters/all.exceptions.filter'; // <-- Import hier';
import 'dotenv/config';


class WinstonLoggerWrapper implements LoggerService {
  log(message: any, context?: string): void {
    const msg = context ? `[${context}] ${String(message)}` : String(message);
    winstonLogger.info(msg);
  }
  error(message: any, trace?: string, context?: string): void {
    const msg = context ? `[${context}] ${String(message)}` : String(message);
    winstonLogger.error(msg, trace ? String(trace) : undefined);
  }
  warn(message: any, context?: string): void {
    const msg = context ? `[${context}] ${String(message)}` : String(message);
    winstonLogger.warn(msg);
  }
  debug(message: any, context?: string): void {
    if (winstonLogger.debug) {
      const msg = context ? `[${context}] ${String(message)}` : String(message);
      winstonLogger.debug(msg);
    }
  }
  verbose(message: any, context?: string): void {
    if (winstonLogger.verbose) {
      const msg = context ? `[${context}] ${String(message)}` : String(message);
      winstonLogger.verbose(msg);
    }
  }
}

async function bootstrap(): Promise<void> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL is not defined in the environment variables.');
  }

  let port: number;
  try {
    const parsedUrl = new URL(apiUrl);
    if (!parsedUrl.port) {
      throw new Error(`No port specified in API_URL: ${apiUrl}`);
    }
    port = Number(parsedUrl.port);
    if (isNaN(port)) {
      throw new Error(`Invalid port in API_URL: ${apiUrl}`);
    }
  } catch (error) {
    console.error('Error parsing API_URL:', error);
    process.exit(1);
  }

// main.ts (NestJS)
const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: true, // Erlaubt alle Ursprünge
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: '*',
  credentials: false
});

  // Global Exception Filter hinzufügen
  app.useGlobalFilters(new AllExceptionsFilter());
  
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  await app.listen(port);
  winstonLogger.info(`API is running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});

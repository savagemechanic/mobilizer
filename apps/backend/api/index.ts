import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';

const server = express();

export default async (req: any, res: any) => {
  // Initialize NestJS app only once (cached)
  if (!global.nestApp) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter);

    const configService = app.get(ConfigService);

    // Parse CORS origins from environment variable
    const corsOrigin = configService.get('CORS_ORIGIN') || 'http://localhost:3000';
    const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

    // Enable CORS with environment-based configuration
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, server-to-server)
        if (!origin) {
          return callback(null, true);
        }

        // Check if the origin is in our allowed list
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS: Blocked request from origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    global.nestApp = app.getHttpAdapter().getInstance();
  }

  return global.nestApp(req, res);
};

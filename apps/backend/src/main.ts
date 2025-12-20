import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Parse CORS origins from environment variable
  // Supports comma-separated origins: "http://localhost:3000,https://your-app.vercel.app"
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

  // Get port from config or use default
  const port = configService.get('PORT') || 4000;

  await app.listen(port);

  console.log(`
    🚀 Server ready at: http://localhost:${port}
    📊 GraphQL Playground: http://localhost:${port}/graphql
    🌍 Environment: ${configService.get('NODE_ENV') || 'development'}
  `);
}

bootstrap();

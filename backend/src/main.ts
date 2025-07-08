import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configure CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  // Serve static files for campaign media if needed
  app.use('/uploads', express.static('uploads'));

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('GameTriggers API')
    .setDescription('The Gametriggers marketplace API documentation')
    .setVersion('1.0')
    .addTag('campaigns')
    .addTag('users')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  fs.writeFileSync(
    './swagger.json',
    JSON.stringify(document, null, 2),
    'utf-8',
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();

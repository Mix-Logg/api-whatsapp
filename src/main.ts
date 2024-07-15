import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createServer } from 'node:http';
import express from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    cors: true,
  });
  const config = new DocumentBuilder()
    .setTitle('mix-api')
    .setDescription('default mix-api')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const options = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true
  };

  app.enableCors(options);

  await app.listen(8080);
}
bootstrap();


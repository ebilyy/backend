import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger, SWAGGER_PATH } from './common/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Порожній CORS_ORIGINS — відбиваємо будь-який origin (зручно локально).
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? true,
    credentials: true,
  });

  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Swagger: http://localhost:${port}/${SWAGGER_PATH}`);
}
bootstrap();

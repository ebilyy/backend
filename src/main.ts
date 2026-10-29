import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger, SWAGGER_PATH } from './common/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // docker stop шле SIGTERM; без хуків Nest не закриє пул БД і запити,
  // що виконуються, обірвуться посеред деплою.
  app.enableShutdownHooks();

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  } else if (process.env.NODE_ENV !== 'production') {
    // Порожній CORS_ORIGINS — відбиваємо будь-який origin (зручно локально).
    // У проді фронт і API на одному домені, тож CORS там вимкнено: відбитий
    // origin з credentials дав би будь-якому сайту, відкритому оператором,
    // читати API від його імені.
    app.enableCors({ origin: true, credentials: true });
  }

  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Swagger: http://localhost:${port}/${SWAGGER_PATH}`);
}
bootstrap();

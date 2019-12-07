import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const server = await app.listen(0);
  process.send({ port: server.address().port });
  console.log(
    'Listening at http://localhost:' +
      server.address().port +
      '/' +
      globalPrefix
  );
}

bootstrap();

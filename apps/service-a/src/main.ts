/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 **/

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

const SERVICE_NAME = 'Service A';
const MAX_IDLE_TIME_IN_SECONDS = 10;
const BEAT_STEP_IN_SECONDS = 1;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  let lastCallTs = Date.now();
  app.use((req, res, next) => {
    console.log(`New request arrived...`);
    lastCallTs = Date.now();
    next();
  });

  const server = await app.listen(0);
  process.send({ port: server.address().port });
  console.log(
    `${SERVICE_NAME} running on http://localhost:${
      server.address().port
    }/${globalPrefix}`
  );

  setInterval(() => {
    console.log(`${SERVICE_NAME} Beating...`);
    console.log(
      'Time passed since last request: ',
      (Date.now() - lastCallTs) / 1000,
      'seconds'
    );
    const idleSeconds = (Date.now() - lastCallTs) / 1000;
    if (idleSeconds > MAX_IDLE_TIME_IN_SECONDS) {
      console.log(`${SERVICE_NAME} has exitted`);
      process.exit();
    }
  }, BEAT_STEP_IN_SECONDS * 1000);
}

bootstrap();

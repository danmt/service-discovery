import { HeartBeat } from '@my-org/heart-beat';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

const SERVICE_NAME = 'Service B';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req, res, next) => {
    heartBeat.requestArrived();
    next();
  });

  const server = await app.listen(0);
  process.send({ port: server.address().port });
  console.log(
    `${SERVICE_NAME} running on http://localhost:${server.address().port}`
  );

  const heartBeat = new HeartBeat(SERVICE_NAME, { explain: true });
  heartBeat.init();
}

bootstrap();

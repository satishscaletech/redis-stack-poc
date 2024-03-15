import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swagger } from './swagger';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req: Request, body: Body, next: any) => {
    console.log(
      '=======> req url:',
      req.url,
      '======> req method:',
      req.method,
    );
    next();
  });

  swagger(app);

  await app.listen(process.env.PORT).then(() => {
    console.log('server started on port:', process.env.PORT);
  });
}
bootstrap();

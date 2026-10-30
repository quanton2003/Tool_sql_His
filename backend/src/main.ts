import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (process.env.CORS_ORIGIN) {
    const extraOrigins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim());
    localOrigins.push(...extraOrigins);
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (localOrigins.includes(origin) || origin.endsWith('.local') || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Serve Frontend directly if frontend/dist exists (All-in-One: 1 single server on port 3000)
  const candidateDistPaths = [
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist'),
  ];
  const frontendDist = candidateDistPaths.find((p) => fs.existsSync(p));

  if (frontendDist) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use(express.static(frontendDist));
    expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
    console.log(`Frontend UI statically served from: ${frontendDist}`);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`=================================================`);
  console.log(`  HIS SQL Assistant running on http://localhost:${port}`);
  if (frontendDist) {
    console.log(`  Web UI & API both ready at: http://localhost:${port}`);
  }
  console.log(`=================================================`);
}

bootstrap();

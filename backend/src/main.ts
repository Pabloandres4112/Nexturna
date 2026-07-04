import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

type ValidationDetail = {
  field: string;
  errors: string[];
};

function flattenValidationErrors(errors: ValidationError[], parentPath = ''): ValidationDetail[] {
  const details: ValidationDetail[] = [];

  for (const error of errors) {
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      details.push({
        field: fieldPath,
        errors: Object.values(error.constraints),
      });
    }

    if (error.children && error.children.length > 0) {
      details.push(...flattenValidationErrors(error.children, fieldPath));
    }
  }

  return details;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://192.168.100.6'],
    credentials: true,
  });

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const details = flattenValidationErrors(errors);
        return new BadRequestException({
          message: 'Error de validación en la solicitud',
          errors: details,
        });
      },
    }),
  );

  // Filtros globales
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptores globales
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 TurnoYa Backend corriendo en http://localhost:${port}`);
  console.log(`📚 API disponible en http://localhost:${port}/api/v1`);
}

bootstrap();

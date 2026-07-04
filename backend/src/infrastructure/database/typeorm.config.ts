import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfigFactory = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST') || 'localhost',
  port: configService.get<number>('DB_PORT') || 5432,
  username: configService.get<string>('DB_USERNAME') || 'turnoya',
  password: configService.get<string>('DB_PASSWORD') || 'turnoya',
  database: configService.get<string>('DB_NAME') || 'turnoya_db',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize:
    configService.get<string>('DB_SYNC') === 'true' ||
    configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  retryAttempts: 20,
  retryDelay: 5000,
  connectTimeoutMS: 10000,
});

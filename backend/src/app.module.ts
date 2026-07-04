import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigFactory } from './infrastructure/database/typeorm.config';
import { IdentityModule } from './modules/identity/identity.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { WhatsappIntegrationModule } from './modules/whatsapp-integration/whatsapp-integration.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),
    IdentityModule,
    SchedulingModule,
    WhatsappIntegrationModule,
    NotificationsModule,
  ],
})
export class AppModule {}

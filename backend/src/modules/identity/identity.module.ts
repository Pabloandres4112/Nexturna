import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

/**
 * Bounded context de identidad: autenticacion y datos del negocio (tenant).
 */
@Module({
  imports: [AuthModule, UsersModule],
  exports: [AuthModule, UsersModule],
})
export class IdentityModule {}

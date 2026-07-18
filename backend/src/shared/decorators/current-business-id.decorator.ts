import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Extrae el id del negocio autenticado desde el JWT ya validado por JwtAuthGuard.
 * Hoy un negocio equivale a un unico UserEntity (sin distincion owner/staff),
 * asi que "business id" y "user id" son el mismo valor: request.user.id.
 * Reemplaza el metodo privado getBusinessId() que estaba duplicado (con
 * logica ligeramente distinta) en QueueController y MessageLogController.
 */
export const CurrentBusinessId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const businessId = request.user?.id;

    if (!businessId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return businessId;
  },
);

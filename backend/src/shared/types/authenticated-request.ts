import type { Request } from 'express';
import type { AuthenticatedUser } from '@identity/auth/auth.dto';

/**
 * Forma de `request` una vez que JwtAuthGuard corrio: `user` viene de
 * JwtStrategy.validate() -> AuthService.validateUserById() -> sanitizeUser(),
 * que retorna un AuthenticatedUser (no la UserEntity completa: sin passwordHash).
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

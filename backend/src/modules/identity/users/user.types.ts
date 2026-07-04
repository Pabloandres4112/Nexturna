import { UserRole } from './user-role.enum';
import { UserSettings } from './user.entity';

export { UserSettings };

export interface User {
  id: string;
  role: UserRole;
  businessName: string;
  whatsappNumber: string;
  settings: UserSettings | null;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  userId: string;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
}

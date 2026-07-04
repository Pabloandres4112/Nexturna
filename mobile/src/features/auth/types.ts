import type { UserSettings } from '@features/settings/types';

export interface AuthUser {
  id: string;
  role: string;
  businessName: string;
  whatsappNumber: string;
  email: string | null;
  settings: UserSettings | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface RegisterDto {
  businessName: string;
  whatsappNumber: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

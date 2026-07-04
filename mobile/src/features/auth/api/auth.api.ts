import httpClient from '@lib/httpClient';
import { AuthResponse, LoginDto, RegisterDto, AuthUser } from '../types';

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const { data } = await httpClient.post<AuthResponse>('/auth/login', dto);
    return data;
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    const { data } = await httpClient.post<AuthResponse>('/auth/register', dto);
    return data;
  },

  getProfile: async (): Promise<AuthUser> => {
    const { data } = await httpClient.get<AuthUser>('/auth/me');
    return data;
  },
};

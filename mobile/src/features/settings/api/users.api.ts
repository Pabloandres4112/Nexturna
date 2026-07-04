import httpClient from '@lib/httpClient';
import type { AuthUser } from '@features/auth/types';
import { UserSettings, UpdateUserDto } from '../types';

export const usersApi = {
  getUser: async (id: string): Promise<AuthUser> => {
    const { data } = await httpClient.get<AuthUser>(`/users/${id}`);
    return data;
  },

  getUserSettings: async (id: string): Promise<UserSettings> => {
    const { data } = await httpClient.get<UserSettings>(`/users/${id}/settings`);
    return data;
  },

  updateUser: async (id: string, dto: UpdateUserDto): Promise<AuthUser> => {
    const { data } = await httpClient.put<AuthUser>(`/users/${id}`, dto);
    return data;
  },
};

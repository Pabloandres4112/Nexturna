import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersApi } from '../api';
import { STORAGE_KEYS } from '../constants';
import { UserSettings, UpdateUserDto } from '../types';
import { useAuth } from './useAuth';

const DEFAULT_SETTINGS: UserSettings = {
  averageServiceTime: 30,
  automationEnabled: true,
  excludedContacts: [],
  maxDaysAhead: 7,
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try cache first
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS_CACHE);
      if (cached) {
        setSettings(JSON.parse(cached) as UserSettings);
      }

      // Then fetch fresh data
      const fresh = await usersApi.getUserSettings(user.id);
      const merged = { ...DEFAULT_SETTINGS, ...fresh };
      setSettings(merged);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS_CACHE,
        JSON.stringify(merged),
      );
    } catch {
      setError('Error al cargar la configuracion');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateSettings = useCallback(
    async (dto: UpdateUserDto) => {
      if (!user) {
        return;
      }

      try {
        setSaving(true);
        setError(null);
        await usersApi.updateUser(user.id, dto);

        // Update local cache
        const updated = { ...settings, ...(dto.settings ?? {}) };
        setSettings(updated);
        await AsyncStorage.setItem(
          STORAGE_KEYS.SETTINGS_CACHE,
          JSON.stringify(updated),
        );
      } catch {
        setError('Error al guardar la configuracion');
        throw new Error('Error al guardar la configuracion');
      } finally {
        setSaving(false);
      }
    },
    [user, settings],
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    refresh: loadSettings,
    updateSettings,
  };
};

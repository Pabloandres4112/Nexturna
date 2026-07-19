import { UserSettings } from './user.entity';

/**
 * Valores por defecto unicos para UserSettings.
 * Antes existian tres copias de esta logica (AuthService, UserService, QueueService)
 * con defaults que habian divergido entre si (automationEnabled y maxDaysAhead
 * distintos en QueueService), causando que un negocio recien registrado viera
 * "7 dias / automatizacion activa" en su perfil pero "0 dias / automatizacion
 * inactiva" al intentar crear un turno.
 */
export function defaultUserSettings(): UserSettings {
  return {
    averageServiceTime: 30,
    automationEnabled: true,
    excludedContacts: [],
    maxDaysAhead: 7,
    queuePaused: false,
  };
}

/**
 * Completa un UserSettings potencialmente incompleto o nulo (tal como viene
 * de la columna JSONB) con los valores por defecto, descartando datos con
 * forma invalida en vez de propagarlos.
 */
export function normalizeUserSettings(
  settings: Partial<UserSettings> | null | undefined,
): UserSettings {
  const defaults = defaultUserSettings();

  return {
    averageServiceTime:
      typeof settings?.averageServiceTime === 'number' && settings.averageServiceTime > 0
        ? settings.averageServiceTime
        : defaults.averageServiceTime,
    automationEnabled:
      typeof settings?.automationEnabled === 'boolean'
        ? settings.automationEnabled
        : defaults.automationEnabled,
    excludedContacts: Array.isArray(settings?.excludedContacts)
      ? settings.excludedContacts.filter((value): value is string => typeof value === 'string')
      : defaults.excludedContacts,
    maxDaysAhead:
      typeof settings?.maxDaysAhead === 'number' && settings.maxDaysAhead >= 0
        ? settings.maxDaysAhead
        : defaults.maxDaysAhead,
    queuePaused:
      typeof settings?.queuePaused === 'boolean' ? settings.queuePaused : defaults.queuePaused,
  };
}

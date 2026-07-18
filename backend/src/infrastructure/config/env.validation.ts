import * as Joi from 'joi';

/**
 * Variables realmente criticas: si faltan, el proceso no debe arrancar.
 * El resto queda opcional para no romper entornos donde WhatsApp/legal
 * todavia no estan configurados (ver WhatsAppService, que ya degrada
 * explicitamente cuando faltan sus propias variables).
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().optional(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SYNC: Joi.string().valid('true', 'false').optional(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  WHATSAPP_API_URL: Joi.string().optional(),
  WHATSAPP_BASE_URL: Joi.string().optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().optional(),
  WHATSAPP_API_TOKEN: Joi.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().optional(),
  WHATSAPP_APP_SECRET: Joi.string().optional(),
  WHATSAPP_VERIFY_TOKEN: Joi.string().optional(),
  WHATSAPP_MAX_RETRIES: Joi.number().optional(),
  WHATSAPP_RETRY_DELAY_MS: Joi.number().optional(),

  NOTIFICATIONS_ENABLED: Joi.string().valid('true', 'false').optional(),
  LOG_LEVEL: Joi.string().optional(),

  LEGAL_TERMS_VERSION: Joi.string().optional(),
  LEGAL_PRIVACY_POLICY_VERSION: Joi.string().optional(),
}).unknown(true);

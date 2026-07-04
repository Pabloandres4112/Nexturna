import { IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para el valor de un campo en el webhook
 */
class WebhookText {
  @IsString()
  @MaxLength(4096)
  body!: string;
}

class WebhookMessage {
  @IsString()
  from!: string;

  @IsString()
  id!: string;

  @IsString()
  timestamp!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookText)
  text?: WebhookText;
}

class WebhookStatus {
  @IsString()
  id!: string;

  @IsString()
  status!: string;

  @IsString()
  timestamp!: string;

  @IsString()
  recipient_id!: string;
}

class WebhookValue {
  @IsString()
  @IsOptional()
  messaging_product?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WebhookMessage)
  messages?: WebhookMessage[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WebhookStatus)
  statuses?: WebhookStatus[];

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookText)
  text?: WebhookText;
}

/**
 * DTO para un cambio en el webhook
 */
class WebhookChange {
  @ValidateNested()
  @Type(() => WebhookValue)
  value!: WebhookValue;

  @IsString()
  field!: string;
}

/**
 * DTO para una entrada en el webhook
 */
class WebhookEntry {
  @IsString()
  id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookChange)
  changes!: WebhookChange[];
}

/**
 * DTO para el webhook de Meta Cloud API
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/overview
 */
export class WhatsAppWebhookDto {
  @IsString()
  object!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookEntry)
  entry!: WebhookEntry[];
}

/**
 * DTO para la verificación GET del webhook
 */
export class WebhookVerificationDto {
  @IsIn(['subscribe'], { message: 'hub.mode debe ser subscribe' })
  'hub.mode': string;

  @IsString()
  'hub.challenge': string;

  @IsString()
  'hub.verify_token': string;
}

/**
 * Respuesta del webhook
 */
export class WebhookResponseDto {
  success: boolean;
  message: string;
}

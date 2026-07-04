import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export enum NotificationType {
  NEW_TURN = 'new-turn',
  TURN_COMPLETED = 'turn-completed',
  QUEUE_UPDATE = 'queue-update',
  NEXT_TURN = 'next-turn',
}

export class SendNotificationDto {
  @IsUUID('4', { message: 'userId debe ser un UUID válido' })
  userId!: string;

  @IsString({ message: 'title debe ser texto' })
  @IsNotEmpty({ message: 'title es obligatorio' })
  @MaxLength(120, { message: 'title no puede superar 120 caracteres' })
  title!: string;

  @IsString({ message: 'body debe ser texto' })
  @IsNotEmpty({ message: 'body es obligatorio' })
  @MaxLength(1000, { message: 'body no puede superar 1000 caracteres' })
  body!: string;

  @IsEnum(NotificationType, { message: 'type no es un tipo de notificación válido' })
  type!: NotificationType;

  @IsOptional()
  @IsObject({ message: 'data debe ser un objeto JSON válido' })
  data?: Record<string, any>;
}

export class QueueUpdateNotificationDto {
  @IsString({ message: 'event debe ser texto' })
  @IsNotEmpty({ message: 'event es obligatorio' })
  @MaxLength(80, { message: 'event no puede superar 80 caracteres' })
  event!: string;

  @IsOptional()
  @IsUUID('4', { message: 'queueId debe ser un UUID válido' })
  queueId?: string;

  @IsOptional()
  @IsObject({ message: 'payload debe ser un objeto JSON válido' })
  payload?: Record<string, unknown>;
}

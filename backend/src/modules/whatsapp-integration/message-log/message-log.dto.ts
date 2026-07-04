import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MessageDirection, MessageType, MessageStatus } from './message-log.entity';

export class CreateMessageLogDto {
  @IsPhoneNumber(undefined, {
    message: 'El teléfono debe estar en formato internacional válido',
  })
  phoneNumber!: string;

  @IsString({ message: 'El mensaje debe ser texto' })
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(1000, { message: 'El mensaje no puede superar 1000 caracteres' })
  messageText!: string;

  @IsEnum(MessageDirection, { message: 'La dirección del mensaje no es válida' })
  direction!: MessageDirection;

  @IsEnum(MessageType, { message: 'El tipo de mensaje no es válido' })
  messageType!: MessageType;

  @IsOptional()
  @IsString({ message: 'whatsappMessageId debe ser texto' })
  @MaxLength(120, { message: 'whatsappMessageId no puede superar 120 caracteres' })
  whatsappMessageId?: string;

  @IsOptional()
  @IsEnum(MessageStatus, { message: 'El estado del mensaje no es válido' })
  status?: MessageStatus;

  @IsOptional()
  @IsUUID('4', { message: 'queueId debe ser un UUID válido' })
  queueId?: string;
}

export class UpdateMessageLogDto {
  @IsOptional()
  @IsEnum(MessageStatus, { message: 'El estado del mensaje no es válido' })
  status?: MessageStatus;

  @IsOptional()
  @IsString({ message: 'whatsappMessageId debe ser texto' })
  @MaxLength(120, { message: 'whatsappMessageId no puede superar 120 caracteres' })
  whatsappMessageId?: string;
}

export class MessageLogResponseDto {
  id!: string;
  businessId!: string;
  phoneNumber!: string;
  messageText!: string;
  direction!: MessageDirection;
  messageType!: MessageType;
  status!: MessageStatus;
  whatsappMessageId?: string | null;
  userId?: string | null;
  queueId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class GetMessageLogsQueryDto {
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'El teléfono debe estar en formato internacional válido',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(MessageDirection, { message: 'La dirección del mensaje no es válida' })
  direction?: MessageDirection;

  @IsOptional()
  @IsEnum(MessageStatus, { message: 'El estado del mensaje no es válido' })
  status?: MessageStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(200, { message: 'limit no puede superar 200' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset debe ser un número entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset?: number;
}

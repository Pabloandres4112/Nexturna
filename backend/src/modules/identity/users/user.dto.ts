import {
  IsArray,
  IsBoolean,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'averageServiceTime debe ser numérico' })
  @Min(1, { message: 'averageServiceTime debe ser mínimo 1 minuto' })
  @Max(240, { message: 'averageServiceTime no puede superar 240 minutos' })
  averageServiceTime?: number;

  @IsOptional()
  @IsBoolean({ message: 'automationEnabled debe ser true o false' })
  automationEnabled?: boolean;

  @IsArray()
  @IsOptional()
  @IsPhoneNumber(undefined, {
    each: true,
    message: 'Cada contacto excluido debe estar en formato internacional válido',
  })
  excludedContacts?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'maxDaysAhead debe ser un entero' })
  @Min(0, { message: 'maxDaysAhead no puede ser negativo' })
  @Max(365, { message: 'maxDaysAhead no puede superar 365 días' })
  maxDaysAhead?: number;

  @IsOptional()
  @IsBoolean({ message: 'queuePaused debe ser true o false' })
  queuePaused?: boolean;
}

export class CreateUserDto {
  @IsString({ message: 'businessName debe ser texto' })
  @IsNotEmpty({ message: 'businessName es obligatorio' })
  @MaxLength(120, { message: 'businessName no puede superar 120 caracteres' })
  businessName!: string;

  @IsPhoneNumber(undefined, {
    message: 'whatsappNumber debe estar en formato internacional válido',
  })
  whatsappNumber!: string;

  @IsOptional()
  @IsEmail({}, { message: 'email no tiene formato válido' })
  @MaxLength(150, { message: 'email no puede superar 150 caracteres' })
  email?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'businessName debe ser texto' })
  @IsNotEmpty({ message: 'businessName no puede estar vacío' })
  @MaxLength(120, { message: 'businessName no puede superar 120 caracteres' })
  businessName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email no tiene formato válido' })
  @MaxLength(150, { message: 'email no puede superar 150 caracteres' })
  email?: string;

  @ValidateNested()
  @Type(() => UserSettingsDto)
  @IsOptional()
  settings?: UserSettingsDto;
}

/**
 * DTO para agregar un contacto a la lista de exclusión.
 * Formato E.164: +57XXXXXXXXXX
 */
export class AddExcludedContactDto {
  @IsPhoneNumber(undefined, {
    message: 'El teléfono debe estar en formato internacional válido',
  })
  phoneNumber!: string;
}

/**
 * DTO para remover un contacto de la lista de exclusión.
 */
export class RemoveExcludedContactDto {
  @IsPhoneNumber(undefined, {
    message: 'El teléfono debe estar en formato internacional válido',
  })
  phoneNumber!: string;
}

/**
 * Respuesta con la lista actualizada de contactos excluidos.
 */
export class ExcludedContactsResponseDto {
  success: boolean;
  message: string;
  excludedContacts: string[];
}

import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El identificador debe ser texto' })
  @IsNotEmpty({ message: 'El identificador es obligatorio' })
  @MaxLength(120, { message: 'El identificador no puede superar 120 caracteres' })
  identifier!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  password!: string;
}

export interface AuthenticatedUser {
  id: string;
  role: string;
  businessName: string;
  whatsappNumber: string;
  email: string | null;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RegisterDto {
  @IsString({ message: 'El nombre del negocio debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del negocio es obligatorio' })
  @MaxLength(120, { message: 'El nombre del negocio no puede superar 120 caracteres' })
  businessName!: string;

  @IsPhoneNumber(undefined, {
    message: 'El número de WhatsApp debe estar en formato internacional válido',
  })
  whatsappNumber!: string;

  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsOptional()
  @MaxLength(150, { message: 'El email no puede superar 150 caracteres' })
  email?: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  password!: string;

  @IsBoolean()
  @Equals(true, { message: 'Debes aceptar los términos y condiciones' })
  acceptTerms!: boolean;

  @IsBoolean()
  @Equals(true, { message: 'Debes aceptar la política de privacidad' })
  acceptPrivacyPolicy!: boolean;

  @IsOptional()
  @IsString({ message: 'La versión de términos debe ser texto' })
  @MaxLength(50, { message: 'La versión de términos no puede superar 50 caracteres' })
  termsVersion?: string;

  @IsOptional()
  @IsString({ message: 'La versión de política de privacidad debe ser texto' })
  @MaxLength(50, {
    message: 'La versión de política de privacidad no puede superar 50 caracteres',
  })
  privacyPolicyVersion?: string;
}

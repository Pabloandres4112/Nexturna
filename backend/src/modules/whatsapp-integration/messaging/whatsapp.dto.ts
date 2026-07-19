import { IsNotEmpty, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class SendTestMessageDto {
  @IsPhoneNumber(undefined, {
    message: 'El teléfono debe estar en formato internacional válido (ej: +573001234567)',
  })
  phoneNumber!: string;

  @IsString({ message: 'El mensaje debe ser texto' })
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(1000, { message: 'El mensaje no puede superar 1000 caracteres' })
  message!: string;
}

export class SendTestMessageResponseDto {
  success!: boolean;
  messageId!: string | null;
  error?: string;
}

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MetaConnectionStatus } from './meta-connection.entity';

/**
 * Conexion manual: alta directa con un waba_id/phone_number_id ya
 * verificados en Meta, sin pasar por el intercambio OAuth de Embedded
 * Signup (todavia no armado del lado mobile). Sirve para dar de alta a
 * mano numeros de prueba mientras esa pieza se termina.
 */
export class ConnectMetaDto {
  @IsString({ message: 'wabaId debe ser texto' })
  @IsNotEmpty({ message: 'wabaId es obligatorio' })
  wabaId!: string;

  @IsString({ message: 'phoneNumberId debe ser texto' })
  @IsNotEmpty({ message: 'phoneNumberId es obligatorio' })
  phoneNumberId!: string;

  @IsOptional()
  @IsString({ message: 'displayPhoneNumber debe ser texto' })
  displayPhoneNumber?: string;
}

export class MetaConnectionResponseDto {
  id!: string;
  businessId!: string;
  wabaId!: string;
  phoneNumberId!: string;
  displayPhoneNumber!: string | null;
  connectionStatus!: MetaConnectionStatus;
  webhookSubscribed!: boolean;
  connectedAt!: Date | null;
}

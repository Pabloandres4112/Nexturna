import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QueueStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  NO_SHOW = 'noShow',
}

export interface QueueItem {
  id: string;
  clientName: string;
  phoneNumber: string;
  position: number;
  status: QueueStatus;
  /** Tiempo estimado de espera en minutos. */
  estimatedTimeMinutes: number;
  priority: boolean;
  createdAt: Date;
  queueDate: Date;
}

export interface GetQueueResponse {
  queue: QueueItem[];
  total: number;
  currentPosition: number;
  message: string;
}

export class CreateQueueDto {
  @IsString({ message: 'El nombre del cliente debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @MaxLength(120, { message: 'El nombre del cliente no puede superar 120 caracteres' })
  clientName!: string;

  @IsPhoneNumber(undefined, { message: 'El teléfono debe estar en formato internacional válido' })
  phoneNumber!: string;

  /** Tiempo estimado de espera en minutos. Si no se provee, se usa el averageServiceTime del negocio. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El tiempo estimado debe ser numérico' })
  @Min(0, { message: 'El tiempo estimado no puede ser negativo' })
  @Max(720, { message: 'El tiempo estimado no puede superar 720 minutos' })
  estimatedTimeMinutes?: number;

  @IsOptional()
  @IsBoolean({ message: 'La prioridad debe ser true o false' })
  priority?: boolean;

  /** Fecha del turno (YYYY-MM-DD). Si no se envia, usa la fecha actual. */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  queueDate?: string;
}

export class UpdateQueueDto {
  @IsOptional()
  @IsEnum(QueueStatus, { message: 'Estado de turno inválido' })
  status?: QueueStatus;

  /** Tiempo estimado de espera en minutos. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El tiempo estimado debe ser numérico' })
  @Min(0, { message: 'El tiempo estimado no puede ser negativo' })
  @Max(720, { message: 'El tiempo estimado no puede superar 720 minutos' })
  estimatedTimeMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La posición debe ser numérica' })
  @Min(1, { message: 'La posición mínima es 1' })
  position?: number;
}

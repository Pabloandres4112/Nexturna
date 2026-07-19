import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MessageDirection {
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
}

export enum MessageType {
  CONFIRMATION = 'CONFIRMATION',
  APPROACHING = 'APPROACHING',
  READY = 'READY',
  CUSTOM = 'CUSTOM',
  INCOMING = 'INCOMING',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

/**
 * Registro de todos los mensajes WhatsApp enviados y recibidos.
 * Se usa para:
 * - Auditoría y cumplimiento normativo
 * - Debugging de integraciones
 * - Análisis de comunicación
 * - Recuperación ante fallos
 */
@Entity('message_logs')
@Index(['businessId', 'createdAt'])
@Index(['phoneNumber', 'createdAt'])
@Index(['direction', 'status'])
export class MessageLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  businessId!: string;

  @Column({ type: 'varchar' })
  phoneNumber!: string;

  @Column({ type: 'text' })
  messageText!: string;

  @Column({
    type: 'enum',
    enum: MessageDirection,
  })
  direction!: MessageDirection;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  messageType!: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status!: MessageStatus;

  /**
   * ID del mensaje devuelto por Meta Cloud API.
   * Usado para tracking de entrega.
   */
  @Column({ type: 'varchar', nullable: true })
  whatsappMessageId?: string | null;

  /**
   * Referencia al usuario/negocio propietario. Sin @ManyToOne/@JoinColumn:
   * la FK se enforcea en Postgres directo sobre esta columna (ver migracion),
   * nada en el codigo navega .user.
   */
  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  /**
   * Referencia al turno (si aplica). Puede ser null si el mensaje no esta
   * asociado a un turno. Misma razon que userId: sin relacion de TypeORM,
   * FK real en Postgres sobre esta columna.
   */
  @Column({ type: 'uuid', nullable: true })
  queueId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

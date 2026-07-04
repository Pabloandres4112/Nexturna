import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { WhatsAppContactEntity } from '../whatsapp-contacts/whatsapp-contact.entity';

export enum QueueStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  NO_SHOW = 'noShow',
}

@Index('idx_queue_business_date_status', ['businessId', 'queueDate', 'status'])
@Entity('queue')
export class QueueEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  clientName!: string;

  @Column({ type: 'varchar' })
  phoneNumber!: string;

  @Index('idx_queue_business_id')
  @Column({ type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => UserEntity, (user) => user.queueItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business!: UserEntity;

  @Index('idx_queue_contact_id')
  @Column({ type: 'uuid', nullable: true })
  contactId!: string | null;

  @ManyToOne(() => WhatsAppContactEntity, (contact) => contact.queueItems, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'contactId' })
  contact!: WhatsAppContactEntity | null;

  @Column({ type: 'enum', enum: QueueStatus, default: QueueStatus.WAITING })
  status!: QueueStatus;

  /**
   * Posicion del turno en la cola del dia para este negocio.
   * El servicio asigna y recalcula este valor; no se usa unique en BD
   * porque las posiciones se reasignan en bloque al avanzar/cancelar.
   * Valor inicial: siguiente disponible despues del ultimo activo del dia.
   */
  @Column({ type: 'int', default: 0 })
  position!: number;

  /** Tiempo estimado de espera hasta que sea atendido, en minutos. */
  @Column({ type: 'int', nullable: true })
  estimatedTimeMinutes!: number | null;

  @Column({ type: 'boolean', default: false })
  priority!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Fecha del turno (sin hora). Permite acumular historico por dia.
   * Decision de diseno: la tabla queue acumula historico; no se purga automaticamente.
   * El indice idx_queue_business_date_status garantiza queries eficientes por dia.
   * Limpieza periodica queda como tarea operativa futura (cron o job externo).
   */
  @Column({ type: 'date' })
  queueDate!: Date;
}

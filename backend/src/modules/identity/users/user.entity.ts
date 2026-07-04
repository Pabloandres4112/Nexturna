import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserRole } from './user-role.enum';
import { WhatsAppContactEntity } from '../whatsapp-contacts/whatsapp-contact.entity';
import { QueueEntity } from '../queue/queue.entity';

/**
 * Configuracion operativa por negocio.
 * Se persiste como JSONB en users.settings.
 * TODOS los campos son obligatorios para evitar inconsistencias silenciosas.
 */
export interface UserSettings {
  /** Duracion promedio de atencion por cliente, en minutos. */
  averageServiceTime: number;
  /** Habilita el envio automatico de mensajes WhatsApp. */
  automationEnabled: boolean;
  /** Numeros de WhatsApp que NO reciben mensajes automaticos (formato E.164). */
  excludedContacts: string[];
  /** Maxima anticipacion en dias para crear un turno. */
  maxDaysAhead: number;
  /** Indica si el negocio tiene pausada la recepcion de nuevos turnos. */
  queuePaused: boolean;
}

@Entity('users')
@Index('idx_single_platform_admin', ['role'], {
  unique: true,
  where: `role = 'platform_admin'`,
})
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUSINESS_OWNER,
  })
  role!: UserRole;

  @Column({ type: 'varchar' })
  businessName!: string;

  @Column({ type: 'varchar', unique: true })
  whatsappNumber!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  settings!: UserSettings | null;

  @OneToMany(() => WhatsAppContactEntity, (contact) => contact.business)
  whatsappContacts!: WhatsAppContactEntity[];

  @OneToMany(() => QueueEntity, (queueItem) => queueItem.business)
  queueItems!: QueueEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

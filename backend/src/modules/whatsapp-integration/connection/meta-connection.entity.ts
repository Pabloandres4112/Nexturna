import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MetaConnectionStatus {
  PENDING = 'pending',
  CONNECTED = 'connected',
  REVOKED = 'revoked',
  ERROR = 'error',
}

/**
 * Conexion de un negocio con su WhatsApp Business Account (WABA) en Meta.
 * waba_id/phone_number_id son identificadores, no secretos: el token que
 * realmente envia mensajes es el System User Token unico de la plataforma
 * (configurado en WHATSAPP_ACCESS_TOKEN), no algo que se guarde por negocio.
 *
 * Sin @ManyToOne/@JoinColumn a UserEntity a proposito: mismo criterio que
 * MessageLogEntity/LegalConsentEntity, la FK real vive en Postgres.
 */
@Entity('meta_connections')
export class MetaConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  businessId!: string;

  @Column({ type: 'varchar' })
  wabaId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  phoneNumberId!: string;

  @Column({ type: 'varchar', nullable: true })
  displayPhoneNumber!: string | null;

  @Column({
    type: 'enum',
    enum: MetaConnectionStatus,
    default: MetaConnectionStatus.PENDING,
  })
  connectionStatus!: MetaConnectionStatus;

  @Column({ type: 'boolean', default: false })
  webhookSubscribed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  connectedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

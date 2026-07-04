import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

/**
 * Evidencia legal de aceptación de términos y política de privacidad.
 * Se guarda por cada registro para auditoría y soporte ante reclamos.
 */
@Entity('legal_consents')
@Index(['userId', 'acceptedAt'])
export class LegalConsentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'boolean', default: true })
  acceptedTerms!: boolean;

  @Column({ type: 'boolean', default: true })
  acceptedPrivacyPolicy!: boolean;

  @Column({ type: 'varchar', length: 50 })
  termsVersion!: string;

  @Column({ type: 'varchar', length: 50 })
  privacyPolicyVersion!: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', nullable: true })
  appVersion!: string | null;

  @CreateDateColumn({ name: 'accepted_at' })
  acceptedAt!: Date;
}

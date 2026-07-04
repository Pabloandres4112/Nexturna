import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { QueueEntity } from '../queue/queue.entity';

@Entity('whatsapp_contacts')
@Index(['businessId', 'whatsappNumber'], { unique: true })
export class WhatsAppContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => UserEntity, (user) => user.whatsappContacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business!: UserEntity;

  @Column({ type: 'varchar' })
  whatsappNumber!: string;

  @Column({ type: 'varchar', nullable: true })
  displayName!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany(() => QueueEntity, (queueItem) => queueItem.contact)
  queueItems!: QueueEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

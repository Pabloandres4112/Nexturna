import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { QueueEntity, QueueStatus } from './queue.entity';
import { UserEntity } from '@identity/users/user.entity';
import { normalizeUserSettings } from '@identity/users/user-settings.util';
import { CreateQueueDto, QueueItem, UpdateQueueDto } from './queue.dto';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectRepository(QueueEntity)
    private readonly queueRepo: Repository<QueueEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private toQueueItem(entity: QueueEntity): QueueItem {
    return {
      id: entity.id,
      clientName: entity.clientName,
      phoneNumber: entity.phoneNumber,
      position: entity.position,
      status: entity.status,
      estimatedTimeMinutes: entity.estimatedTimeMinutes ?? 0,
      priority: entity.priority,
      createdAt: entity.createdAt,
      queueDate: entity.queueDate,
    };
  }

  private todayDateString(): string {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private normalizeDate(dateInput: string): string {
    const parsed = new Date(`${dateInput}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Fecha invalida. Use formato YYYY-MM-DD');
    }
    return parsed.toISOString().slice(0, 10);
  }

  private activeStatuses(): QueueStatus[] {
    return [QueueStatus.WAITING, QueueStatus.IN_PROGRESS];
  }

  private async loadBusinessAndSettings(
    userRepo: Repository<UserEntity>,
    businessId: string,
  ): Promise<{ business: UserEntity; settings: ReturnType<typeof normalizeUserSettings> }> {
    const business = await userRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return {
      business,
      settings: normalizeUserSettings(business.settings),
    };
  }

  private daysBetweenUtc(start: string, end: string): number {
    const a = new Date(`${start}T00:00:00.000Z`).getTime();
    const b = new Date(`${end}T00:00:00.000Z`).getTime();
    return Math.floor((b - a) / (24 * 60 * 60 * 1000));
  }

  private async reindexActiveQueueForDate(
    queueRepo: Repository<QueueEntity>,
    businessId: string,
    queueDate: string,
  ): Promise<void> {
    const activeItems = await queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
      .orderBy('q.position', 'ASC')
      .addOrderBy('q.createdAt', 'ASC')
      .getMany();

    const inProgress = activeItems.find((item) => item.status === QueueStatus.IN_PROGRESS) ?? null;
    const waiting = activeItems
      .filter((item) => item.status === QueueStatus.WAITING)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority ? -1 : 1;
        }
        return a.position - b.position;
      });

    const ordered = inProgress ? [inProgress, ...waiting] : waiting;

    for (let i = 0; i < ordered.length; i++) {
      ordered[i].position = i + 1;
    }

    if (ordered.length > 0) {
      await queueRepo.save(ordered);
    }
  }

  private async recalculateEstimatedTimes(
    manager: EntityManager,
    businessId: string,
    queueDate: string,
  ): Promise<void> {
    const queueRepo = manager.getRepository(QueueEntity);
    const { settings } = await this.loadBusinessAndSettings(
      manager.getRepository(UserEntity),
      businessId,
    );

    const activeItems = await queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
      .orderBy('q.position', 'ASC')
      .getMany();

    const waitingItems = activeItems.filter((item) => item.status === QueueStatus.WAITING);

    for (const item of waitingItems) {
      item.estimatedTimeMinutes = settings.averageServiceTime * (item.position - 1);
    }

    if (waitingItems.length > 0) {
      await queueRepo.save(waitingItems);
    }
  }

  private async advanceNextWaiting(
    queueRepo: Repository<QueueEntity>,
    businessId: string,
    queueDate: string,
  ): Promise<QueueEntity | null> {
    const next = await queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status = :status', { status: QueueStatus.WAITING })
      .orderBy('q.priority', 'DESC')
      .addOrderBy('q.position', 'ASC')
      .getOne();

    if (!next) {
      return null;
    }

    next.status = QueueStatus.IN_PROGRESS;
    next.estimatedTimeMinutes = 0;
    return queueRepo.save(next);
  }

  /**
   * Reindexa y recalcula tiempos estimados dentro de la misma transaccion
   * que la mutacion que los origino. Centralizado aca para no repetir el
   * mismo par de llamadas en cada metodo mutador.
   */
  private async settleQueueForDate(
    manager: EntityManager,
    businessId: string,
    queueDate: string,
  ): Promise<void> {
    const queueRepo = manager.getRepository(QueueEntity);
    await this.reindexActiveQueueForDate(queueRepo, businessId, queueDate);
    await this.recalculateEstimatedTimes(manager, businessId, queueDate);
  }

  private async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }

  async getQueue(businessId: string) {
    return this.getQueueByDate(businessId, this.todayDateString());
  }

  async getQueueByDate(businessId: string, date: string) {
    const queueDate = this.normalizeDate(date);

    const items = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
      .orderBy('q.priority', 'DESC')
      .addOrderBy('q.position', 'ASC')
      .getMany();

    const currentItem = items.find((i) => i.status === QueueStatus.IN_PROGRESS);

    return {
      queue: items.map((item) => this.toQueueItem(item)),
      total: items.length,
      currentPosition: currentItem?.position ?? 0,
      message: 'Cola obtenida correctamente',
    };
  }

  /**
   * Adquiere un advisory lock de Postgres para (businessId, queueDate),
   * liberado automaticamente al terminar la transaccion. A diferencia de un
   * SELECT ... FOR UPDATE, esto serializa altas concurrentes AUNQUE la cola
   * del dia todavia no tenga ninguna fila que bloquear (el caso que se nos
   * escapaba: el primer turno del dia para un negocio).
   */
  private async lockQueueForDate(
    manager: EntityManager,
    businessId: string,
    queueDate: string,
  ): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${businessId}:${queueDate}`,
    ]);
  }

  /**
   * Alta a la cola. Corre dentro de una transaccion, serializada por
   * (businessId, queueDate) via advisory lock: dos altas concurrentes para
   * el mismo negocio/dia ya no pueden calcular la misma posicion ni
   * saltarse la verificacion de telefono duplicado.
   */
  async addToQueue(businessId: string, createQueueDto: CreateQueueDto) {
    return this.runInTransaction(async (manager) => {
      const queueRepo = manager.getRepository(QueueEntity);
      const today = this.todayDateString();
      const queueDate = this.normalizeDate(createQueueDto.queueDate ?? today);
      const { settings } = await this.loadBusinessAndSettings(
        manager.getRepository(UserEntity),
        businessId,
      );

      if (settings.queuePaused) {
        throw new BadRequestException('La cola esta en pausa y no acepta nuevos turnos');
      }

      const daysAhead = this.daysBetweenUtc(today, queueDate);
      if (daysAhead < 0) {
        throw new BadRequestException('No se pueden crear turnos en fechas pasadas');
      }
      if (daysAhead > settings.maxDaysAhead) {
        throw new BadRequestException(
          `La fecha supera el maximo permitido de ${settings.maxDaysAhead} dia(s) de anticipacion`,
        );
      }

      // A partir de aca dos requests concurrentes para el mismo negocio/dia
      // quedan serializadas: la segunda espera a que la primera confirme o
      // revierta antes de leer duplicados o la ultima posicion.
      await this.lockQueueForDate(manager, businessId, queueDate);

      const duplicatedCount = await queueRepo
        .createQueryBuilder('q')
        .where('q.businessId = :businessId', { businessId })
        .andWhere('q.queueDate = :queueDate::date', { queueDate })
        .andWhere('q.phoneNumber = :phoneNumber', { phoneNumber: createQueueDto.phoneNumber })
        .getCount();

      if (duplicatedCount > 0) {
        throw new ConflictException(
          'Ya existe un turno para este telefono en la fecha seleccionada',
        );
      }

      const lastActive = await queueRepo
        .createQueryBuilder('q')
        .where('q.businessId = :businessId', { businessId })
        .andWhere('q.queueDate = :queueDate::date', { queueDate })
        .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
        .orderBy('q.position', 'DESC')
        .getOne();

      const newItem = queueRepo.create({
        clientName: createQueueDto.clientName,
        phoneNumber: createQueueDto.phoneNumber,
        businessId,
        status: QueueStatus.WAITING,
        position: (lastActive?.position ?? 0) + 1,
        estimatedTimeMinutes: createQueueDto.estimatedTimeMinutes ?? 0,
        priority: createQueueDto.priority ?? false,
        queueDate: new Date(queueDate),
      });

      const saved = await queueRepo.save(newItem);

      await this.settleQueueForDate(manager, businessId, queueDate);

      const refreshed = await queueRepo.findOne({ where: { id: saved.id, businessId } });

      const totalInQueue = await queueRepo
        .createQueryBuilder('q')
        .where('q.businessId = :businessId', { businessId })
        .andWhere('q.queueDate = :queueDate::date', { queueDate })
        .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
        .getCount();

      this.logger.log(`Turno creado para negocio ${businessId}: ${saved.id}`);

      return {
        success: true,
        message: 'Cliente agregado a la cola',
        data: this.toQueueItem(refreshed ?? saved),
        totalInQueue,
      };
    });
  }

  async updateQueueItem(businessId: string, id: string, updateQueueDto: UpdateQueueDto) {
    return this.runInTransaction(async (manager) => {
      const queueRepo = manager.getRepository(QueueEntity);
      const item = await queueRepo.findOne({ where: { id, businessId } });
      if (!item) {
        throw new NotFoundException('Turno no encontrado');
      }

      if (updateQueueDto.status !== undefined) {
        item.status = updateQueueDto.status as unknown as QueueStatus;
      }
      if (updateQueueDto.estimatedTimeMinutes !== undefined) {
        item.estimatedTimeMinutes = updateQueueDto.estimatedTimeMinutes;
      }
      if (updateQueueDto.position !== undefined) {
        item.position = updateQueueDto.position;
      }

      const updated = await queueRepo.save(item);
      const queueDate = item.queueDate.toISOString().slice(0, 10);
      await this.settleQueueForDate(manager, businessId, queueDate);

      return {
        success: true,
        message: 'Turno actualizado',
        data: this.toQueueItem(updated),
      };
    });
  }

  async removeFromQueue(businessId: string, id: string) {
    return this.runInTransaction(async (manager) => {
      const queueRepo = manager.getRepository(QueueEntity);
      const item = await queueRepo.findOne({ where: { id, businessId } });
      if (!item) {
        throw new NotFoundException('Turno no encontrado');
      }

      await queueRepo.remove(item);

      const queueDate = item.queueDate.toISOString().slice(0, 10);
      await this.settleQueueForDate(manager, businessId, queueDate);

      this.logger.log(`Turno eliminado para negocio ${businessId}: ${id}`);

      return {
        success: true,
        message: 'Turno eliminado',
      };
    });
  }

  async nextInQueue(businessId: string) {
    return this.runInTransaction(async (manager) => {
      const queueRepo = manager.getRepository(QueueEntity);
      const queueDate = this.todayDateString();

      const inProgress = await queueRepo
        .createQueryBuilder('q')
        .where('q.businessId = :businessId', { businessId })
        .andWhere('q.queueDate = :queueDate::date', { queueDate })
        .andWhere('q.status = :status', { status: QueueStatus.IN_PROGRESS })
        .getOne();

      if (inProgress) {
        inProgress.status = QueueStatus.COMPLETED;
        await queueRepo.save(inProgress);
      }

      const advanced = await this.advanceNextWaiting(queueRepo, businessId, queueDate);

      await this.settleQueueForDate(manager, businessId, queueDate);

      if (!advanced) {
        return { success: true, message: 'No hay mas turnos en espera', data: null };
      }

      const refreshed = await queueRepo.findOne({ where: { id: advanced.id, businessId } });

      return {
        success: true,
        message: 'Siguiente turno',
        data: this.toQueueItem(refreshed ?? advanced),
      };
    });
  }

  async completeQueueItem(businessId: string, id: string) {
    return this.runInTransaction(async (manager) => {
      const queueRepo = manager.getRepository(QueueEntity);
      const item = await queueRepo.findOne({ where: { id, businessId } });
      if (!item) {
        throw new NotFoundException('Turno no encontrado');
      }

      item.status = QueueStatus.COMPLETED;
      const updated = await queueRepo.save(item);

      const queueDate = item.queueDate.toISOString().slice(0, 10);
      await this.settleQueueForDate(manager, businessId, queueDate);

      return {
        success: true,
        message: 'Turno completado',
        data: this.toQueueItem(updated),
      };
    });
  }

  async skipQueueItem(businessId: string, id: string) {
    return this.runInTransaction(async (manager) => {
      const queueRepo = manager.getRepository(QueueEntity);
      const item = await queueRepo.findOne({ where: { id, businessId } });
      if (!item) {
        throw new NotFoundException('Turno no encontrado');
      }

      const queueDate = item.queueDate.toISOString().slice(0, 10);
      const wasInProgress = item.status === QueueStatus.IN_PROGRESS;

      item.status = QueueStatus.NO_SHOW;
      const skipped = await queueRepo.save(item);

      if (wasInProgress) {
        await this.advanceNextWaiting(queueRepo, businessId, queueDate);
      }

      await this.settleQueueForDate(manager, businessId, queueDate);

      return {
        success: true,
        message: 'Turno omitido',
        data: this.toQueueItem(skipped),
      };
    });
  }

  async pauseQueue(businessId: string) {
    const { business, settings } = await this.loadBusinessAndSettings(this.userRepo, businessId);
    business.settings = {
      ...settings,
      queuePaused: true,
    };
    await this.userRepo.save(business);

    return {
      success: true,
      message: 'Cola en pausa',
      queuePaused: true,
    };
  }

  async resumeQueue(businessId: string) {
    const { business, settings } = await this.loadBusinessAndSettings(this.userRepo, businessId);
    business.settings = {
      ...settings,
      queuePaused: false,
    };
    await this.userRepo.save(business);

    return {
      success: true,
      message: 'Cola reanudada',
      queuePaused: false,
    };
  }
}

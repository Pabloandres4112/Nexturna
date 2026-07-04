import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueEntity, QueueStatus as EntityQueueStatus } from './queue.entity';
import { UserEntity, UserSettings } from '../users/user.entity';
import { CreateQueueDto, UpdateQueueDto } from './queue.dto';

const DEFAULT_SERVICE_TIME_MINUTES = 30;
const DEFAULT_MAX_DAYS_AHEAD = 0;

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntity)
    private readonly queueRepo: Repository<QueueEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

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

  private activeStatuses(): EntityQueueStatus[] {
    return [EntityQueueStatus.WAITING, EntityQueueStatus.IN_PROGRESS];
  }

  private withDefaultSettings(settings: UserSettings | null): UserSettings {
    return {
      averageServiceTime:
        typeof settings?.averageServiceTime === 'number' && settings.averageServiceTime > 0
          ? settings.averageServiceTime
          : DEFAULT_SERVICE_TIME_MINUTES,
      automationEnabled:
        typeof settings?.automationEnabled === 'boolean' ? settings.automationEnabled : false,
      excludedContacts: Array.isArray(settings?.excludedContacts)
        ? settings.excludedContacts.filter((value): value is string => typeof value === 'string')
        : [],
      maxDaysAhead:
        typeof settings?.maxDaysAhead === 'number' && settings.maxDaysAhead >= 0
          ? settings.maxDaysAhead
          : DEFAULT_MAX_DAYS_AHEAD,
      queuePaused: typeof settings?.queuePaused === 'boolean' ? settings.queuePaused : false,
    };
  }

  private async getBusinessAndSettings(businessId: string): Promise<{
    business: UserEntity;
    settings: UserSettings;
  }> {
    const business = await this.userRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return {
      business,
      settings: this.withDefaultSettings(business.settings),
    };
  }

  private daysBetweenUtc(start: string, end: string): number {
    const a = new Date(`${start}T00:00:00.000Z`).getTime();
    const b = new Date(`${end}T00:00:00.000Z`).getTime();
    return Math.floor((b - a) / (24 * 60 * 60 * 1000));
  }

  private async reindexActiveQueueForDate(businessId: string, queueDate: string): Promise<void> {
    const activeItems = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
      .orderBy('q.position', 'ASC')
      .addOrderBy('q.createdAt', 'ASC')
      .getMany();

    const inProgress =
      activeItems.find((item) => item.status === EntityQueueStatus.IN_PROGRESS) ?? null;
    const waiting = activeItems
      .filter((item) => item.status === EntityQueueStatus.WAITING)
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
      await this.queueRepo.save(ordered);
    }
  }

  private async recalculateEstimatedTimes(businessId: string, queueDate: string): Promise<void> {
    const { settings } = await this.getBusinessAndSettings(businessId);

    const activeItems = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
      .orderBy('q.position', 'ASC')
      .getMany();

    const waitingItems = activeItems.filter((item) => item.status === EntityQueueStatus.WAITING);

    for (const item of waitingItems) {
      item.estimatedTimeMinutes = settings.averageServiceTime * (item.position - 1);
    }

    if (waitingItems.length > 0) {
      await this.queueRepo.save(waitingItems);
    }
  }

  private async advanceNextWaiting(
    businessId: string,
    queueDate: string,
  ): Promise<QueueEntity | null> {
    const next = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status = :status', { status: EntityQueueStatus.WAITING })
      .orderBy('q.priority', 'DESC')
      .addOrderBy('q.position', 'ASC')
      .getOne();

    if (!next) {
      return null;
    }

    next.status = EntityQueueStatus.IN_PROGRESS;
    next.estimatedTimeMinutes = 0;
    return this.queueRepo.save(next);
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

    const currentItem = items.find((i) => i.status === EntityQueueStatus.IN_PROGRESS);

    return {
      queue: items,
      total: items.length,
      currentPosition: currentItem?.position ?? 0,
      message: 'Cola obtenida correctamente',
    };
  }

  async addToQueue(businessId: string, createQueueDto: CreateQueueDto) {
    const today = this.todayDateString();
    const queueDate = this.normalizeDate(createQueueDto.queueDate ?? today);
    const { settings } = await this.getBusinessAndSettings(businessId);

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

    const duplicatedCount = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.phoneNumber = :phoneNumber', { phoneNumber: createQueueDto.phoneNumber })
      .getCount();

    if (duplicatedCount > 0) {
      throw new ConflictException('Ya existe un turno para este telefono en la fecha seleccionada');
    }

    const lastActive = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
      .orderBy('q.position', 'DESC')
      .getOne();

    const newItem = this.queueRepo.create({
      clientName: createQueueDto.clientName,
      phoneNumber: createQueueDto.phoneNumber,
      businessId,
      status: EntityQueueStatus.WAITING,
      position: (lastActive?.position ?? 0) + 1,
      estimatedTimeMinutes: createQueueDto.estimatedTimeMinutes ?? 0,
      priority: createQueueDto.priority ?? false,
      queueDate: new Date(queueDate),
    });

    const saved = await this.queueRepo.save(newItem);

    await this.reindexActiveQueueForDate(businessId, queueDate);
    await this.recalculateEstimatedTimes(businessId, queueDate);

    const refreshed = await this.queueRepo.findOne({ where: { id: saved.id, businessId } });

    const totalInQueue = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status IN (:...statuses)', { statuses: this.activeStatuses() })
      .getCount();

    return {
      success: true,
      message: 'Cliente agregado a la cola',
      data: refreshed ?? saved,
      totalInQueue,
    };
  }

  async updateQueueItem(businessId: string, id: string, updateQueueDto: UpdateQueueDto) {
    const item = await this.queueRepo.findOne({ where: { id, businessId } });
    if (!item) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (updateQueueDto.status !== undefined) {
      item.status = updateQueueDto.status as unknown as EntityQueueStatus;
    }
    if (updateQueueDto.estimatedTimeMinutes !== undefined) {
      item.estimatedTimeMinutes = updateQueueDto.estimatedTimeMinutes;
    }
    if (updateQueueDto.position !== undefined) {
      item.position = updateQueueDto.position;
    }

    const updated = await this.queueRepo.save(item);
    const queueDate = item.queueDate.toISOString().slice(0, 10);
    await this.reindexActiveQueueForDate(businessId, queueDate);
    await this.recalculateEstimatedTimes(businessId, queueDate);

    return {
      success: true,
      message: 'Turno actualizado',
      data: updated,
    };
  }

  async removeFromQueue(businessId: string, id: string) {
    const item = await this.queueRepo.findOne({ where: { id, businessId } });
    if (!item) {
      throw new NotFoundException('Turno no encontrado');
    }

    await this.queueRepo.remove(item);

    const queueDate = item.queueDate.toISOString().slice(0, 10);
    await this.reindexActiveQueueForDate(businessId, queueDate);
    await this.recalculateEstimatedTimes(businessId, queueDate);

    return {
      success: true,
      message: 'Turno eliminado',
    };
  }

  async nextInQueue(businessId: string) {
    const queueDate = this.todayDateString();

    const inProgress = await this.queueRepo
      .createQueryBuilder('q')
      .where('q.businessId = :businessId', { businessId })
      .andWhere('q.queueDate = :queueDate::date', { queueDate })
      .andWhere('q.status = :status', { status: EntityQueueStatus.IN_PROGRESS })
      .getOne();

    if (inProgress) {
      inProgress.status = EntityQueueStatus.COMPLETED;
      await this.queueRepo.save(inProgress);
    }

    const advanced = await this.advanceNextWaiting(businessId, queueDate);

    await this.reindexActiveQueueForDate(businessId, queueDate);
    await this.recalculateEstimatedTimes(businessId, queueDate);

    if (!advanced) {
      return { success: true, message: 'No hay mas turnos en espera', data: null };
    }

    const refreshed = await this.queueRepo.findOne({ where: { id: advanced.id, businessId } });

    return {
      success: true,
      message: 'Siguiente turno',
      data: refreshed ?? advanced,
    };
  }

  async completeQueueItem(businessId: string, id: string) {
    const item = await this.queueRepo.findOne({ where: { id, businessId } });
    if (!item) {
      throw new NotFoundException('Turno no encontrado');
    }

    item.status = EntityQueueStatus.COMPLETED;
    const updated = await this.queueRepo.save(item);

    const queueDate = item.queueDate.toISOString().slice(0, 10);
    await this.reindexActiveQueueForDate(businessId, queueDate);
    await this.recalculateEstimatedTimes(businessId, queueDate);

    return {
      success: true,
      message: 'Turno completado',
      data: updated,
    };
  }

  async skipQueueItem(businessId: string, id: string) {
    const item = await this.queueRepo.findOne({ where: { id, businessId } });
    if (!item) {
      throw new NotFoundException('Turno no encontrado');
    }

    const queueDate = item.queueDate.toISOString().slice(0, 10);
    const wasInProgress = item.status === EntityQueueStatus.IN_PROGRESS;

    item.status = EntityQueueStatus.NO_SHOW;
    const skipped = await this.queueRepo.save(item);

    if (wasInProgress) {
      await this.advanceNextWaiting(businessId, queueDate);
    }

    await this.reindexActiveQueueForDate(businessId, queueDate);
    await this.recalculateEstimatedTimes(businessId, queueDate);

    return {
      success: true,
      message: 'Turno omitido',
      data: skipped,
    };
  }

  async pauseQueue(businessId: string) {
    const { business, settings } = await this.getBusinessAndSettings(businessId);
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
    const { business, settings } = await this.getBusinessAndSettings(businessId);
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

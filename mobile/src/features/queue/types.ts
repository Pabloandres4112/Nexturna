export type QueueStatus = 'waiting' | 'in-progress' | 'completed' | 'noShow';

export interface QueueItem {
  id: string;
  clientName: string;
  phoneNumber: string;
  position: number;
  status: QueueStatus;
  estimatedTimeMinutes: number;
  priority: boolean;
  createdAt: string;
  updatedAt: string;
  queueDate: string;
}

export interface QueueResponse {
  queue: QueueItem[];
  total: number;
  currentPosition: number;
  message?: string;
}

export interface QueueHistoryResponse {
  items: QueueItem[];
  total: number;
  completedCount: number;
  noShowCount: number;
  date: string;
  message?: string;
}

export interface QueueMutationResponse {
  success: boolean;
  message: string;
  data: QueueItem | null;
  totalInQueue?: number;
}

export interface CreateQueueDto {
  clientName: string;
  phoneNumber: string;
  estimatedTimeMinutes?: number;
  priority?: boolean;
}

export interface UpdateQueueDto {
  status?: QueueStatus;
  estimatedTimeMinutes?: number;
  position?: number;
}

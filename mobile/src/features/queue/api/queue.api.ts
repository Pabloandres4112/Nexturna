import httpClient from '@lib/httpClient';
import {
  QueueResponse,
  QueueHistoryResponse,
  CreateQueueDto,
  QueueMutationResponse,
  UpdateQueueDto,
} from '../types';

export const queueApi = {
  getQueue: async (): Promise<QueueResponse> => {
    const { data } = await httpClient.get<QueueResponse>('/queue');
    return data;
  },

  getQueueHistory: async (date?: string): Promise<QueueHistoryResponse> => {
    const { data } = await httpClient.get<QueueHistoryResponse>('/queue/history', {
      params: date ? { date } : undefined,
    });
    return data;
  },

  addToQueue: async (dto: CreateQueueDto): Promise<QueueMutationResponse> => {
    const { data } = await httpClient.post<QueueMutationResponse>('/queue', dto);
    return data;
  },

  updateQueueItem: async (id: string, dto: UpdateQueueDto): Promise<QueueMutationResponse> => {
    const { data } = await httpClient.put<QueueMutationResponse>(`/queue/${id}`, dto);
    return data;
  },

  removeFromQueue: async (id: string): Promise<void> => {
    await httpClient.delete(`/queue/${id}`);
  },

  nextInQueue: async (): Promise<QueueMutationResponse> => {
    const { data } = await httpClient.post<QueueMutationResponse>('/queue/next');
    return data;
  },

  completeQueueItem: async (id: string): Promise<QueueMutationResponse> => {
    const { data } = await httpClient.post<QueueMutationResponse>(`/queue/complete/${id}`);
    return data;
  },
};

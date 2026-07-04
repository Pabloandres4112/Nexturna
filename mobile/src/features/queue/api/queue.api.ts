import httpClient from '@lib/httpClient';
import {
  QueueResponse,
  CreateQueueDto,
  QueueMutationResponse,
  UpdateQueueDto,
} from '../types';

export const queueApi = {
  getQueue: async (): Promise<QueueResponse> => {
    const { data } = await httpClient.get<QueueResponse>('/queue');
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

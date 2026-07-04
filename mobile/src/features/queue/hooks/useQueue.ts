import { useState, useEffect, useCallback } from 'react';
import { QueueItem, QueueResponse, CreateQueueDto } from '../types';
import { getApiErrorMessage, queueApi } from '../api';

const parseApiError = (error: unknown, fallback: string): string => {
  if (typeof getApiErrorMessage === 'function') {
    return getApiErrorMessage(error, fallback);
  }
  return fallback;
};

export const useQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: QueueResponse = await queueApi.getQueue();
      setQueue(response.queue ?? []);
      setTotal(response.total ?? 0);
    } catch (caughtError) {
      setError(parseApiError(caughtError, 'Error al cargar la cola'));
    } finally {
      setLoading(false);
    }
  }, []);

  const addToQueue = useCallback(
    async (data: CreateQueueDto) => {
      try {
        const response = await queueApi.addToQueue(data);
        await loadQueue();
        return response;
      } catch (caughtError) {
        throw new Error(parseApiError(caughtError, 'No se pudo agregar el cliente'));
      }
    },
    [loadQueue],
  );

  const nextInQueue = useCallback(async () => {
    try {
      await queueApi.nextInQueue();
      await loadQueue();
    } catch (caughtError) {
      throw new Error(parseApiError(caughtError, 'No se pudo avanzar al siguiente turno'));
    }
  }, [loadQueue]);

  const completeItem = useCallback(
    async (id: string) => {
      try {
        await queueApi.completeQueueItem(id);
        await loadQueue();
      } catch (caughtError) {
        throw new Error(parseApiError(caughtError, 'No se pudo completar el turno'));
      }
    },
    [loadQueue],
  );

  const removeItem = useCallback(
    async (id: string) => {
      try {
        await queueApi.removeFromQueue(id);
        await loadQueue();
      } catch (caughtError) {
        throw new Error(parseApiError(caughtError, 'No se pudo eliminar el turno'));
      }
    },
    [loadQueue],
  );

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const activeQueue = queue.filter(
    (i) => i.status === 'waiting' || i.status === 'in-progress',
  );
  const currentItem = queue.find((i) => i.status === 'in-progress') ?? null;
  const waitingCount = queue.filter((i) => i.status === 'waiting').length;
  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const noShowCount = queue.filter((i) => i.status === 'noShow').length;

  return {
    queue,
    activeQueue,
    currentItem,
    total,
    waitingCount,
    completedCount,
    noShowCount,
    loading,
    error,
    refresh: loadQueue,
    addToQueue,
    nextInQueue,
    completeItem,
    removeItem,
  };
};

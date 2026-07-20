import { useCallback, useEffect, useState } from 'react';
import { QueueItem } from '../types';
import { queueApi } from '../api/queue.api';
import { getApiErrorMessage } from '@lib/httpClient';

const parseApiError = (error: unknown, fallback: string): string => {
  if (typeof getApiErrorMessage === 'function') {
    return getApiErrorMessage(error, fallback);
  }
  return fallback;
};

export const useQueueHistory = (date?: string) => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [noShowCount, setNoShowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await queueApi.getQueueHistory(date);
      setItems(response.items ?? []);
      setCompletedCount(response.completedCount ?? 0);
      setNoShowCount(response.noShowCount ?? 0);
    } catch (caughtError) {
      setError(parseApiError(caughtError, 'Error al cargar el historial'));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    items,
    total: items.length,
    completedCount,
    noShowCount,
    loading,
    error,
    refresh: loadHistory,
  };
};

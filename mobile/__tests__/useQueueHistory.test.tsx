/**
 * Tests for the useQueueHistory custom hook
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useQueueHistory} from '../src/features/queue/hooks/useQueueHistory';
import * as apiModule from '../src/features/queue/api/queue.api';

jest.mock('../src/features/queue/api/queue.api', () => ({
  queueApi: {
    getQueueHistory: jest.fn(),
  },
}));

jest.mock('@lib/httpClient', () => ({
  getApiErrorMessage: jest.fn((_error: unknown, fallback: string) => fallback),
}));

const mockHistoryItems = [
  {
    id: '1',
    clientName: 'Juan Perez',
    phoneNumber: '+573001234567',
    position: 1,
    status: 'completed' as const,
    estimatedTimeMinutes: 15,
    priority: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:10:00.000Z',
    queueDate: '2024-01-01T00:00:00.000Z',
  },
];

const mockHistoryResponse = {
  items: mockHistoryItems,
  total: 1,
  completedCount: 1,
  noShowCount: 0,
  date: '2024-01-01',
  message: 'ok',
};

/** Helper: renders the hook inside a test component and exposes results via ref */
function renderUseQueueHistory(date?: string) {
  const resultRef: {current: ReturnType<typeof useQueueHistory> | null} = {
    current: null,
  };

  function TestComponent() {
    const hookResult = useQueueHistory(date);
    resultRef.current = hookResult;
    return null;
  }

  let renderer: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<TestComponent />);
  });

  return {resultRef, renderer: renderer!};
}

describe('useQueueHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.queueApi.getQueueHistory as jest.Mock).mockResolvedValue(mockHistoryResponse);
  });

  it('should start with loading true and empty items', () => {
    (apiModule.queueApi.getQueueHistory as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    const {resultRef} = renderUseQueueHistory();

    expect(resultRef.current!.loading).toBe(true);
    expect(resultRef.current!.items).toEqual([]);
    expect(resultRef.current!.error).toBeNull();
  });

  it('should load history data on mount', async () => {
    const {resultRef} = renderUseQueueHistory();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(apiModule.queueApi.getQueueHistory).toHaveBeenCalledTimes(1);
    expect(apiModule.queueApi.getQueueHistory).toHaveBeenCalledWith(undefined);
    expect(resultRef.current!.items).toEqual(mockHistoryItems);
    expect(resultRef.current!.completedCount).toBe(1);
    expect(resultRef.current!.noShowCount).toBe(0);
    expect(resultRef.current!.loading).toBe(false);
  });

  it('should pass the date param through to the api', async () => {
    renderUseQueueHistory('2024-02-02');

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(apiModule.queueApi.getQueueHistory).toHaveBeenCalledWith('2024-02-02');
  });

  it('should expose a refresh function', async () => {
    const {resultRef} = renderUseQueueHistory();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(typeof resultRef.current!.refresh).toBe('function');
  });

  it('should set error when getQueueHistory throws', async () => {
    (apiModule.queueApi.getQueueHistory as jest.Mock).mockRejectedValueOnce(
      new Error('Network error'),
    );

    const {resultRef} = renderUseQueueHistory();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(resultRef.current!.error).toBe('Error al cargar el historial');
    expect(resultRef.current!.loading).toBe(false);
  });

  it('should reload data when refresh is called', async () => {
    const {resultRef} = renderUseQueueHistory();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      await resultRef.current!.refresh();
    });

    expect(apiModule.queueApi.getQueueHistory).toHaveBeenCalledTimes(2);
  });
});

/**
 * Tests for the useQueue custom hook
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useQueue} from '../src/features/queue/hooks/useQueue';
import * as apiModule from '../src/features/queue/api/queue.api';

jest.mock('../src/features/queue/api/queue.api', () => ({
  queueApi: {
    getQueue: jest.fn(),
    addToQueue: jest.fn(),
    nextInQueue: jest.fn(),
    completeQueueItem: jest.fn(),
    removeFromQueue: jest.fn(),
    updateQueueItem: jest.fn(),
  },
}));

jest.mock('@lib/httpClient', () => ({
  getApiErrorMessage: jest.fn((_error: unknown, fallback: string) => fallback),
}));

const mockQueue = [
  {
    id: '1',
    clientName: 'Juan Perez',
    phoneNumber: '+573001234567',
    position: 1,
    status: 'in-progress' as const,
    estimatedTimeMinutes: 15,
    priority: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    queueDate: '2024-01-01T00:00:00.000Z',
  },
];

const mockQueueResponse = {
  queue: mockQueue,
  total: 1,
  currentPosition: 1,
};

/** Helper: renders the hook inside a test component and exposes results via ref */
function renderUseQueue() {
  const resultRef: {current: ReturnType<typeof useQueue> | null} = {
    current: null,
  };

  function TestComponent() {
    const hookResult = useQueue();
    resultRef.current = hookResult;
    return null;
  }

  let renderer: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<TestComponent />);
  });

  return {resultRef, renderer: renderer!};
}

describe('useQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.queueApi.getQueue as jest.Mock).mockResolvedValue(mockQueueResponse);
  });

  it('should start with loading true and empty queue', () => {
    (apiModule.queueApi.getQueue as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    const {resultRef} = renderUseQueue();

    expect(resultRef.current!.loading).toBe(true);
    expect(resultRef.current!.queue).toEqual([]);
    expect(resultRef.current!.error).toBeNull();
  });

  it('should load queue data on mount', async () => {
    const {resultRef} = renderUseQueue();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(apiModule.queueApi.getQueue).toHaveBeenCalledTimes(1);
    expect(resultRef.current!.queue).toEqual(mockQueue);
    expect(resultRef.current!.loading).toBe(false);
  });

  it('should expose refresh, addToQueue and nextInQueue functions', async () => {
    const {resultRef} = renderUseQueue();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(typeof resultRef.current!.refresh).toBe('function');
    expect(typeof resultRef.current!.addToQueue).toBe('function');
    expect(typeof resultRef.current!.nextInQueue).toBe('function');
  });

  it('should set error when getQueue throws', async () => {
    (apiModule.queueApi.getQueue as jest.Mock).mockRejectedValueOnce(
      new Error('Network error'),
    );

    const {resultRef} = renderUseQueue();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(resultRef.current!.error).toBe('Error al cargar la cola');
    expect(resultRef.current!.loading).toBe(false);
  });

  it('should call queueApi.addToQueue and reload when addToQueue is called', async () => {
    (apiModule.queueApi.addToQueue as jest.Mock).mockResolvedValueOnce({id: '2', clientName: 'Nuevo'});

    const {resultRef} = renderUseQueue();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      await resultRef.current!.addToQueue({
        clientName: 'Nuevo Cliente',
        phoneNumber: '+573002222222',
      });
    });

    expect(apiModule.queueApi.addToQueue).toHaveBeenCalledWith({
      clientName: 'Nuevo Cliente',
      phoneNumber: '+573002222222',
    });
    expect(apiModule.queueApi.getQueue).toHaveBeenCalledTimes(2);
  });

  it('should call queueApi.nextInQueue and reload when nextInQueue is called', async () => {
    (apiModule.queueApi.nextInQueue as jest.Mock).mockResolvedValueOnce({id: '1'});

    const {resultRef} = renderUseQueue();

    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      await resultRef.current!.nextInQueue();
    });

    expect(apiModule.queueApi.nextInQueue).toHaveBeenCalledTimes(1);
    expect(apiModule.queueApi.getQueue).toHaveBeenCalledTimes(2);
  });
});

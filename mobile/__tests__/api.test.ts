/**
 * Tests for the API module (queueApi)
 */

import { queueApi } from '../src/features/queue/api/queue.api';
import apiClient from '../src/lib/httpClient';

// Mock the axios instance
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  (mockAxios.create as jest.Mock).mockReturnValue(mockAxios);
  return { default: mockAxios, ...mockAxios };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('queueApi', () => {
  it('queueApi is defined', () => {
    expect(queueApi).toBeDefined();
    expect(typeof queueApi.getQueue).toBe('function');
    expect(typeof queueApi.addToQueue).toBe('function');
    expect(typeof queueApi.nextInQueue).toBe('function');
    expect(typeof queueApi.removeFromQueue).toBe('function');
    expect(typeof queueApi.completeQueueItem).toBe('function');
  });

  it('apiClient default export is defined', () => {
    expect(apiClient).toBeDefined();
  });
});

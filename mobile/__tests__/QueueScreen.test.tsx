/**
 * Tests for QueueScreen component
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import QueueScreen from '../src/features/queue/screens/QueueScreen';
import {getAllText} from '../src/testUtils';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

const mockRefresh = jest.fn();
const mockNextInQueue = jest.fn();
const mockCompleteItem = jest.fn();
const mockRemoveItem = jest.fn();

const mockQueueData = [
  {
    id: '1',
    clientName: 'Juan Perez',
    phoneNumber: '+573001234567',
    position: 1,
    status: 'in-progress',
    estimatedTimeMinutes: 15,
    priority: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    queueDate: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    clientName: 'Maria Garcia',
    phoneNumber: '+573009876543',
    position: 2,
    status: 'waiting',
    estimatedTimeMinutes: 30,
    priority: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    queueDate: '2024-01-01T00:00:00.000Z',
  },
];

jest.mock('../src/features/queue/hooks/useQueue', () => ({
  useQueue: jest.fn(() => ({
    queue: mockQueueData,
    activeQueue: mockQueueData,
    currentItem: mockQueueData[0],
    total: 2,
    waitingCount: 1,
    completedCount: 0,
    noShowCount: 0,
    loading: false,
    error: null,
    refresh: mockRefresh,
    addToQueue: jest.fn(),
    nextInQueue: mockNextInQueue,
    completeItem: mockCompleteItem,
    removeItem: mockRemoveItem,
  })),
}));

describe('QueueScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<QueueScreen />);
    });
  });

  it('displays client names after data loads', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<QueueScreen />);
    });

    const text = getAllText(renderer!.root);
    expect(text).toContain('Juan Perez');
    expect(text).toContain('Maria Garcia');
  });

  it('displays the "Siguiente turno" button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<QueueScreen />);
    });

    const text = getAllText(renderer!.root);
    expect(text.toLowerCase()).toContain('siguiente');
  });
});

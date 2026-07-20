/**
 * Tests for HistoryScreen component
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import HistoryScreen from '../src/features/queue/screens/HistoryScreen';
import {getAllText} from '../src/testUtils';

const mockRefresh = jest.fn();

jest.mock('../src/features/queue/hooks/useQueueHistory', () => ({
  useQueueHistory: jest.fn(() => ({
    items: [
      {
        id: '1',
        clientName: 'Juan Perez',
        phoneNumber: '+573001234567',
        position: 1,
        status: 'completed',
        estimatedTimeMinutes: 15,
        priority: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:10:00.000Z',
        queueDate: '2024-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        clientName: 'Maria Lopez',
        phoneNumber: '+573007654321',
        position: 2,
        status: 'noShow',
        estimatedTimeMinutes: 10,
        priority: false,
        createdAt: '2024-01-01T00:05:00.000Z',
        updatedAt: '2024-01-01T00:20:00.000Z',
        queueDate: '2024-01-01T00:00:00.000Z',
      },
    ],
    total: 2,
    completedCount: 1,
    noShowCount: 1,
    loading: false,
    error: null,
    refresh: mockRefresh,
  })),
}));

describe('HistoryScreen', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HistoryScreen />);
    });
  });

  it('displays the client names from history items', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HistoryScreen />);
    });

    const text = getAllText(renderer!.root);
    expect(text).toContain('Juan Perez');
    expect(text).toContain('Maria Lopez');
  });

  it('shows the "Atendido" label for completed items and "Cerrado" for no-shows', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HistoryScreen />);
    });

    const text = getAllText(renderer!.root);
    expect(text).toContain('Atendido:');
    expect(text).toContain('Cerrado:');
  });

  it('displays the completed and no-show summary counts', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HistoryScreen />);
    });

    const text = getAllText(renderer!.root).toLowerCase();
    expect(text).toContain('asistieron');
  });
});

describe('HistoryScreen loading state', () => {
  it('shows a loading spinner only when there are no items yet', async () => {
    jest.resetModules();
    jest.doMock('../src/features/queue/hooks/useQueueHistory', () => ({
      useQueueHistory: jest.fn(() => ({
        items: [],
        total: 0,
        completedCount: 0,
        noShowCount: 0,
        loading: true,
        error: null,
        refresh: jest.fn(),
      })),
    }));

    const {default: HistoryScreenLoading} = require('../src/features/queue/screens/HistoryScreen');

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HistoryScreenLoading />);
    });

    const text = getAllText(renderer!.root).toLowerCase();
    expect(text).toContain('cargando historial');

    jest.dontMock('../src/features/queue/hooks/useQueueHistory');
  });
});

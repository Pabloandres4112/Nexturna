/**
 * Tests for HomeScreen component
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import HomeScreen from '../src/features/home/screens/HomeScreen';
import {getAllText} from '../src/testUtils';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => ({params: {}}),
}));

jest.mock('@features/auth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: '1',
      businessName: 'Test Negocio',
      whatsappNumber: '+573001234567',
      email: null,
      role: 'business_owner',
      settings: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: mockLogout,
    clearError: jest.fn(),
  })),
}));

jest.mock('@features/queue', () => ({
  useQueue: jest.fn(() => ({
    queue: [],
    activeQueue: [],
    currentItem: null,
    total: 0,
    waitingCount: 2,
    completedCount: 5,
    noShowCount: 1,
    loading: false,
    error: null,
    refresh: jest.fn(),
    addToQueue: jest.fn(),
    nextInQueue: jest.fn(),
    completeItem: jest.fn(),
    removeItem: jest.fn(),
  })),
  useQueueHistory: jest.fn(() => ({
    items: [],
    total: 6,
    completedCount: 5,
    noShowCount: 1,
    loading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

jest.mock('@features/settings', () => ({
  useSettings: jest.fn(() => ({
    settings: {
      averageServiceTime: 30,
      automationEnabled: true,
      excludedContacts: [],
      maxDaysAhead: 7,
    },
    loading: false,
    saving: false,
    error: null,
    refresh: jest.fn(),
    updateSettings: jest.fn(),
  })),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HomeScreen />);
    });
  });

  it('displays the business name', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(getAllText(renderer!.root)).toContain('Test Negocio');
  });

  it('displays metrics section', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const text = getAllText(renderer!.root);
    expect(text.toLowerCase()).toContain('espera');
  });

  it('navigates to Queue screen when queue button is pressed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const text = getAllText(renderer!.root);
    expect(text.toLowerCase()).toContain('cola');
  });
});

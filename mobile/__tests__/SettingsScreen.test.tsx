/**
 * Tests for SettingsScreen component
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SettingsScreen from '../src/features/settings/screens/SettingsScreen';
import {getAllText} from '../src/testUtils';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@features/auth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: '1',
      businessName: 'Test Negocio',
      whatsappNumber: '+573001234567',
      email: 'test@test.com',
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
    logout: jest.fn(),
    clearError: jest.fn(),
  })),
}));

jest.mock('../src/features/settings/hooks/useSettings', () => ({
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

describe('SettingsScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<SettingsScreen />);
    });
  });

  it('displays business name in settings', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<SettingsScreen />);
    });

    expect(getAllText(renderer!.root)).toContain('Test Negocio');
  });

  it('displays the average service time field', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<SettingsScreen />);
    });

    const text = getAllText(renderer!.root);
    expect(text.toLowerCase()).toContain('promedio');
  });

  it('displays the version footer', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<SettingsScreen />);
    });

    expect(getAllText(renderer!.root)).toContain('Nexturna v1.0.0');
  });
});

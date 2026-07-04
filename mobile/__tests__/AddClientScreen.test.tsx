/**
 * Tests for AddClientScreen component
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Alert} from 'react-native';
import AddClientScreen from '../src/features/queue/screens/AddClientScreen';
import {getAllText, findButtonByText} from '../src/testUtils';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

const mockAddToQueue = jest.fn();

jest.mock('../src/features/queue/hooks/useQueue', () => ({
  useQueue: jest.fn(() => ({
    queue: [],
    activeQueue: [],
    currentItem: null,
    total: 0,
    waitingCount: 0,
    completedCount: 0,
    noShowCount: 0,
    loading: false,
    error: null,
    refresh: jest.fn(),
    addToQueue: mockAddToQueue,
    nextInQueue: jest.fn(),
    completeItem: jest.fn(),
    removeItem: jest.fn(),
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

jest.mock('../src/features/auth/hooks/useAuth', () => ({
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
    logout: jest.fn(),
    clearError: jest.fn(),
  })),
}));

jest.spyOn(Alert, 'alert');

describe('AddClientScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<AddClientScreen />);
    });
  });

  it('displays the Nuevo turno title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<AddClientScreen />);
    });

    expect(getAllText(renderer!.root)).toContain('Nuevo turno');
  });

  it('displays input fields for client name and phone number', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<AddClientScreen />);
    });

    const {TextInput} = require('react-native');
    const inputs = renderer!.root.findAllByType(TextInput);

    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('calls addToQueue with form data when valid inputs are provided', async () => {
    mockAddToQueue.mockResolvedValueOnce({id: '1', clientName: 'Test Client'});
    (Alert.alert as jest.Mock).mockImplementationOnce(
      (_title: string, _message: string, buttons?: Array<{onPress?: () => void}>) => {
        buttons?.[0]?.onPress?.();
      },
    );

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<AddClientScreen />);
    });

    const {TextInput} = require('react-native');
    const inputs = renderer!.root.findAllByType(TextInput);

    await ReactTestRenderer.act(async () => {
      inputs[0].props.onChangeText('Test Client');
      inputs[1].props.onChangeText('+573001234567');
    });

    const submitButton = findButtonByText(renderer!.root, 'Agregar a la cola');

    await ReactTestRenderer.act(async () => {
      await submitButton!.props.onPress();
    });

    expect(mockAddToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Test Client',
        phoneNumber: '+573001234567',
      }),
    );
  });
});

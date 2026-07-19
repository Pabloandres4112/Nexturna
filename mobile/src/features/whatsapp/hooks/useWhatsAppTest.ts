import { useCallback, useState } from 'react';
import { getApiErrorMessage } from '@lib/httpClient';
import { whatsappApi } from '../api/whatsapp.api';
import { SendTestMessageResponse } from '../types';

export const useWhatsAppTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendTestMessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTestMessage = useCallback(async (phoneNumber: string, message: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await whatsappApi.sendTestMessage({ phoneNumber, message });
      setResult(response);
      return response;
    } catch (caughtError) {
      const errorMessage = getApiErrorMessage(
        caughtError,
        'No se pudo enviar el mensaje de prueba',
      );
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, result, error, sendTestMessage };
};

import httpClient from '@lib/httpClient';
import { SendTestMessageDto, SendTestMessageResponse } from '../types';

export const whatsappApi = {
  sendTestMessage: async (dto: SendTestMessageDto): Promise<SendTestMessageResponse> => {
    const { data } = await httpClient.post<SendTestMessageResponse>('/whatsapp/test-send', dto);
    return data;
  },
};

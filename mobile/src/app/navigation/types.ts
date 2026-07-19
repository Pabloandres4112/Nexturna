import type { QueueItem } from '@features/queue/types';
import type { AuthStackParamList } from '@features/auth/types';

export type { AuthStackParamList };

export type AppStackParamList = {
  Home: undefined;
  Queue: undefined;
  AddClient: undefined;
  Settings: undefined;
  ClientDetail: { item: QueueItem };
  WhatsAppTest: undefined;
};

export type RootStackParamList = AuthStackParamList & AppStackParamList;

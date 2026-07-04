export interface UserSettings {
  averageServiceTime: number;
  automationEnabled: boolean;
  excludedContacts: string[];
  maxDaysAhead: number;
  queuePaused?: boolean;
}

export interface UpdateUserDto {
  businessName?: string;
  email?: string;
  settings?: Partial<UserSettings>;
}

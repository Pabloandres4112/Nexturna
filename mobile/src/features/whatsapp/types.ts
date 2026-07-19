export interface SendTestMessageDto {
  phoneNumber: string;
  message: string;
}

export interface SendTestMessageResponse {
  success: boolean;
  messageId: string | null;
  error?: string;
}

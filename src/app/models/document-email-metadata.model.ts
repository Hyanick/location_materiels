import { EmailDeliveryStatus } from './email-delivery-status.model';

export interface DocumentEmailMetadata {
  status: EmailDeliveryStatus;
  lastAttemptAt: string;
  lastSentAt: string;
  lastError: string;
}

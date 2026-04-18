import { Company } from './company.model';
import { Customer } from './customer.model';
import { DocumentEmailMetadata } from './document-email-metadata.model';
import { RentalDocumentLine } from './rental-document-line.model';

/**
 * Document de location complet.
 */
export interface RentalDocument {
  company: Company;
  customer: Customer;
  documentDate: string;
  pickupDate: string;
  returnDate: string;
  paymentMethod: string;
  depositPaymentMethod: string;
  depositAmount: number;
  downPayment: number;
  notes: string;
  showSignatureFrame: boolean;
  customerSignatureDataUrl: string;
  emailDelivery: DocumentEmailMetadata;
  lines: RentalDocumentLine[];
  totalAmount: number;
  balanceDue: number;
}

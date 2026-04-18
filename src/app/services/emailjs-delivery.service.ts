import { Injectable } from '@angular/core';
import { RentalDocument } from '../models/rental-document.model';
import { EmailJsSettings } from '../models/emailjs-settings.model';

interface EmailJsSendPayload {
  service_id: string;
  template_id: string;
  user_id: string;
  template_params: Record<string, string>;
}

@Injectable()
export class EmailJsDeliveryService {
  private readonly endpoint = 'https://api.emailjs.com/api/v1.0/email/send';

  async sendDocument(document: RentalDocument, settings: EmailJsSettings): Promise<void> {
    const payload: EmailJsSendPayload = {
      service_id: settings.serviceId.trim(),
      template_id: settings.templateId.trim(),
      user_id: settings.publicKey.trim(),
      template_params: this.buildTemplateParams(document)
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `EmailJS error ${response.status}`);
    }
  }

  getTemplateVariablesSummary(): string[] {
    return [
      'to_email',
      'customer_name',
      'document_subject',
      'company_name',
      'document_date',
      'pickup_date',
      'return_date',
      'total_amount',
      'deposit_amount',
      'payment_method',
      'deposit_payment_method',
      'document_summary',
      'notes',
      'signature_image'
    ];
  }

  private buildTemplateParams(document: RentalDocument): Record<string, string> {
    const customerName = document.customer.fullName.trim() || 'client';

    return {
      to_email: document.customer.email.trim(),
      customer_name: customerName,
      customer_address: document.customer.address.trim(),
      customer_postal_code: document.customer.postalCode.trim(),
      customer_city: document.customer.city.trim(),
      customer_phone: document.customer.phone.trim(),
      document_subject: `Votre bon de location - ${customerName}`,
      company_name: document.company.name.trim(),
      company_phone: document.company.phone.trim(),
      company_email: document.company.email.trim(),
      document_date: this.formatDate(document.documentDate),
      pickup_date: this.formatDate(document.pickupDate),
      return_date: this.formatDate(document.returnDate),
      total_amount: this.formatAmount(document.totalAmount),
      deposit_amount: this.formatAmount(document.depositAmount),
      balance_due: this.formatAmount(document.balanceDue),
      down_payment: this.formatAmount(document.downPayment),
      payment_method: document.paymentMethod,
      deposit_payment_method: document.depositPaymentMethod,
      notes: document.notes,
      document_summary: this.buildDocumentSummary(document),
      signature_image: document.customerSignatureDataUrl || ''
    };
  }

  private buildDocumentSummary(document: RentalDocument): string {
    const lines = document.lines.length
      ? document.lines
          .map((line) => `- ${line.description}: ${line.quantity} x ${this.formatAmount(line.unitPrice)} = ${this.formatAmount(line.total)}`)
          .join('\n')
      : '- Aucune ligne renseignée';

    return [
      `Client: ${document.customer.fullName || ''}`,
      `Adresse: ${document.customer.address || ''}, ${document.customer.postalCode || ''} ${document.customer.city || ''}`.trim(),
      `Retrait: ${this.formatDate(document.pickupDate)}`,
      `Retour: ${this.formatDate(document.returnDate)}`,
      '',
      'Articles:',
      lines,
      '',
      `Acompte: ${this.formatAmount(document.downPayment)}`,
      `Caution: ${this.formatAmount(document.depositAmount)}`,
      `Total: ${this.formatAmount(document.totalAmount)}`,
      `Solde: ${this.formatAmount(document.balanceDue)}`
    ].join('\n');
  }

  private formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  private formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR').format(date);
  }
}

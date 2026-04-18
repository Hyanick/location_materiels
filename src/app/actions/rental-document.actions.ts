import { Injectable, inject } from '@angular/core';
import { DEFAULT_RENTAL_DOCUMENT } from '../data/default-rental-document.data';
import { RENTAL_CATALOG } from '../data/rental-catalog.data';
import { RentalDocumentLine } from '../models/rental-document-line.model';
import { RentalCalculationService } from '../services/rental-calculation.service';
import { RentalStorageService } from '../services/rental-storage.service';
import { EmailDeliveryStatus } from '../models/email-delivery-status.model';
import { RentalDocumentStore } from '../state/rental-document.store';

/**
 * Actions applicatives qui encapsulent les mutations du state.
 */
@Injectable()
export class RentalDocumentActions {
  private readonly store = inject(RentalDocumentStore);
  private readonly calculationService = inject(RentalCalculationService);
  private readonly storageService = inject(RentalStorageService);

  /**
   * Recharge le document depuis le localStorage.
   */
  hydrateFromStorage(): void {
    const storedDocument = this.storageService.read();
    const document = storedDocument ?? DEFAULT_RENTAL_DOCUMENT;

    this.store.setDocument(this.calculationService.computeDocument(document));
  }

  /**
   * Réinitialise totalement le document.
   */
  resetDocument(): void {
    const resetDocument = this.calculationService.computeDocument(DEFAULT_RENTAL_DOCUMENT);
    this.store.setDocument(resetDocument);
    this.storageService.save(resetDocument);
  }

  /**
   * Met à jour n'importe quel champ racine du document.
   */
  updateDocumentField<K extends keyof typeof DEFAULT_RENTAL_DOCUMENT>(field: K, value: (typeof DEFAULT_RENTAL_DOCUMENT)[K]): void {
    const current = this.store.getSnapshot();
    const nextDocument = this.calculationService.computeDocument({
      ...current,
      [field]: value
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  /**
   * Met à jour la signature client.
   */
  updateCustomerSignature(signatureDataUrl: string): void {
    const current = this.store.getSnapshot();
    const nextDocument = this.calculationService.computeDocument({
      ...current,
      customerSignatureDataUrl: signatureDataUrl
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  updateEmailDelivery(status: EmailDeliveryStatus, extra?: { lastError?: string; markSent?: boolean }): void {
    const current = this.store.getSnapshot();
    const now = new Date().toISOString();
    const nextDocument = this.calculationService.computeDocument({
      ...current,
      emailDelivery: {
        ...current.emailDelivery,
        status,
        lastAttemptAt: now,
        lastSentAt: extra?.markSent ? now : current.emailDelivery.lastSentAt,
        lastError: extra?.lastError ?? ''
      }
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  /**
   * Met à jour les informations société.
   */
  updateCompanyField(field: keyof typeof DEFAULT_RENTAL_DOCUMENT.company, value: string): void {
    const current = this.store.getSnapshot();
    const nextDocument = this.calculationService.computeDocument({
      ...current,
      company: {
        ...current.company,
        [field]: value
      }
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  /**
   * Met à jour les informations client.
   */
  updateCustomerField(field: keyof typeof DEFAULT_RENTAL_DOCUMENT.customer, value: string): void {
    const current = this.store.getSnapshot();
    const nextDocument = this.calculationService.computeDocument({
      ...current,
      customer: {
        ...current.customer,
        [field]: value
      }
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  /**
   * Met à jour plusieurs informations client en une seule opération.
   */
  patchCustomer(patch: Partial<typeof DEFAULT_RENTAL_DOCUMENT.customer>): void {
    const current = this.store.getSnapshot();
    const nextDocument = this.calculationService.computeDocument({
      ...current,
      customer: {
        ...current.customer,
        ...patch
      }
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  /**
   * Ajoute une nouvelle ligne basée sur un article du catalogue.
   */
  addLineByItemId(itemId: string): void {
    const item = RENTAL_CATALOG.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    const current = this.store.getSnapshot();

    const newLine: RentalDocumentLine = {
      itemId: item.id,
      description: item.label,
      quantity: 1,
      unitPrice: item.unitPrice,
      total: item.unitPrice
    };

    const nextDocument = this.calculationService.computeDocument({
      ...current,
      lines: [...current.lines, newLine]
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  /**
   * Supprime une ligne à l'index donné.
   */
  removeLine(index: number): void {
    const current = this.store.getSnapshot();
    const nextLines = current.lines.filter((_, lineIndex) => lineIndex !== index);

    const nextDocument = this.calculationService.computeDocument({
      ...current,
      lines: nextLines
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }

  /**
   * Met à jour un champ de ligne.
   */
  updateLineField(index: number, field: keyof RentalDocumentLine, value: string | number): void {
    const current = this.store.getSnapshot();

    const nextLines = current.lines.map((line, lineIndex) => {
      if (lineIndex !== index) {
        return line;
      }

      return {
        ...line,
        [field]: value
      } as RentalDocumentLine;
    });

    const nextDocument = this.calculationService.computeDocument({
      ...current,
      lines: nextLines
    });

    this.store.setDocument(nextDocument);
    this.storageService.save(nextDocument);
  }
}

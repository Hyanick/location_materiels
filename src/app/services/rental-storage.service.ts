import { Injectable } from '@angular/core';
import { DEFAULT_RENTAL_DOCUMENT } from '../data/default-rental-document.data';
import { RentalDocument } from '../models/rental-document.model';

/**
 * Service d'accès au localStorage.
 */
@Injectable()
export class RentalStorageService {
  private readonly storageKey = 'rental-document-app/current-document';

  save(document: RentalDocument): void {
    localStorage.setItem(this.storageKey, JSON.stringify(document));
  }

  read(): RentalDocument | null {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      const parsedDocument = JSON.parse(rawValue) as Partial<RentalDocument>;
      return {
        ...DEFAULT_RENTAL_DOCUMENT,
        ...parsedDocument,
        company: {
          ...DEFAULT_RENTAL_DOCUMENT.company,
          ...(parsedDocument.company ?? {})
        },
        customer: {
          ...DEFAULT_RENTAL_DOCUMENT.customer,
          ...(parsedDocument.customer ?? {})
        },
        emailDelivery: {
          ...DEFAULT_RENTAL_DOCUMENT.emailDelivery,
          ...(parsedDocument.emailDelivery ?? {})
        },
        lines: parsedDocument.lines ?? DEFAULT_RENTAL_DOCUMENT.lines
      };
    } catch (error: unknown) {
      console.error('Impossible de relire le document sauvegardé :', error);
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}

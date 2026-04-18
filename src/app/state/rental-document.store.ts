import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_RENTAL_DOCUMENT } from '../data/default-rental-document.data';
import { RentalDocument } from '../models/rental-document.model';

/**
 * State applicatif central du document de location.
 */
@Injectable()
export class RentalDocumentStore {
  /**
   * Signal privé contenant l'état complet du document.
   */
  private readonly documentSignal = signal<RentalDocument>(DEFAULT_RENTAL_DOCUMENT);

  /**
   * Lecture publique du document.
   */
  readonly document = computed(() => this.documentSignal());

  /**
   * Remplace entièrement le document.
   */
  setDocument(document: RentalDocument): void {
    this.documentSignal.set(document);
  }

  /**
   * Met à jour partiellement le document.
   */
  patchDocument(patch: Partial<RentalDocument>): void {
    this.documentSignal.update((current) => ({
      ...current,
      ...patch
    }));
  }

  /**
   * Retourne l'état brut courant.
   */
  getSnapshot(): RentalDocument {
    return this.documentSignal();
  }
}

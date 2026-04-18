import { Injectable, inject } from '@angular/core';
import { RentalDocumentActions } from '../actions/rental-document.actions';

/**
 * Provider applicatif chargé d'initialiser l'état au démarrage.
 */
@Injectable()
export class RentalDocumentProvider {
  private readonly actions = inject(RentalDocumentActions);

  constructor() {
    this.actions.hydrateFromStorage();
  }
}

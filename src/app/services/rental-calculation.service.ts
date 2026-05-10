import { Injectable, inject } from '@angular/core';
import { RentalDocument } from '../models/rental-document.model';
import { RentalDocumentLine } from '../models/rental-document-line.model';
import { LocalCatalogService } from './local-catalog.service';

/**
 * Service dédié aux calculs métier du document.
 */
@Injectable()
export class RentalCalculationService {
  private readonly catalogService = inject(LocalCatalogService);

  /**
   * Calcule le total d'une ligne.
   */
  computeLineTotal(quantity: number, unitPrice: number): number {
    return this.round(quantity * unitPrice);
  }

  /**
   * Recalcule chaque ligne puis les montants globaux du document.
   */
  computeDocument(document: RentalDocument): RentalDocument {
    const computedLines: RentalDocumentLine[] = document.lines.map((line) => ({
      ...line,
      total: this.computeLineTotal(line.quantity, line.unitPrice)
    }));

    const totalAmount = this.round(
      computedLines.reduce((sum, line) => sum + line.total, 0)
    );
    const depositAmount = this.round(
      computedLines.reduce(
        (sum, line) => sum + this.computeLineDeposit(line.itemId, line.quantity),
        0
      )
    );

    const balanceDue = this.round(totalAmount - document.downPayment);

    return {
      ...document,
      depositAmount,
      lines: computedLines,
      totalAmount,
      balanceDue
    };
  }

  /**
   * Calcule la caution d'une ligne selon le barème du matériel.
   */
  private computeLineDeposit(itemId: string, quantity: number): number {
    const unitDeposit = this.catalogService.getById(itemId)?.depositAmount ?? 0;
    return this.round(unitDeposit * quantity);
  }

  /**
   * Arrondi à 2 décimales.
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

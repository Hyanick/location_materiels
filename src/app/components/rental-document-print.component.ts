import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RentalDocument } from '../models/rental-document.model';

@Component({
  selector: 'app-rental-document-print',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="print-wrapper">
      <div class="print-page">
        <div class="print-page-content">
          <div class="doc-top-row">
            <div class="box company-box">
              <div class="company-name">{{ document.company.name }}</div>
              <div>{{ document.company.address }}</div>
              <div>{{ document.company.city }}</div>
              <div>{{ document.company.phone }}</div>
              <div>{{ document.company.email }}</div>
            </div>

            <div class="box customer-box">
              <div class="box-title">Nom Client : <strong>{{ document.customer.fullName || '' }}</strong></div>
              <div>Adresse : <strong>{{ document.customer.address || '' }}</strong></div>
              <div>CP / Ville : <strong>{{ document.customer.postalCode || '' }} {{ document.customer.city || '' }}</strong></div>
              <div>Tél : <strong>{{ document.customer.phone || '' }}</strong></div>
              <div>Adresse mail : <strong>{{ document.customer.email || '' }}</strong></div>
            </div>
          </div>

          <div class="document-date">En date du {{ formatDate(document.documentDate) }}</div>

          <table class="document-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              @if (document.lines.length === 0) {
                <tr>
                  <td colspan="4" class="placeholder-cell">Ajoutez des lignes depuis le formulaire.</td>
                </tr>
              }

              @for (line of document.lines; track $index) {
                <tr>
                  <td>{{ line.description }}</td>
                  <td class="center">{{ line.quantity }}</td>
                  <td class="center">{{ formatPrice(line.unitPrice) }}</td>
                  <td class="center">{{ formatPrice(line.total) }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="dates-block">
            <div><strong>Prise en compte du matériel :</strong> {{ formatDate(document.pickupDate) }}</div>
            <div><strong>Retour du matériel :</strong> {{ formatDate(document.returnDate) }}</div>
          </div>

          <div class="notes-block warning-note">
            {{ document.notes }}
          </div>

          <div class="total-row">Montant total – Net à payer : <strong>{{ formatPrice(document.totalAmount) }}</strong></div>

          <table class="summary-table">
            <tbody>
              <tr>
                <td>Acompte</td>
                <td class="right">{{ formatPrice(document.downPayment) }}</td>
              </tr>
              @for (item of depositBreakdown; track item.label) {
                <tr class="deposit-detail-row">
                  <td>{{ formatDepositLabel(item.label, item.quantity, item.unitAmount) }}</td>
                  <td class="right">{{ formatPrice(item.total) }}</td>
                </tr>
              }
              <tr>
                <td><strong>{{ getDepositSummaryLabel() }}</strong> {{ getDepositSummarySuffix() }}</td>
                <td class="right">{{ formatPrice(document.depositAmount) }}</td>
              </tr>
              <tr>
                <td><strong>Solde</strong></td>
                <td class="right"><strong>{{ formatPrice(document.balanceDue) }}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="payment-line">Mode paiement : {{ document.paymentMethod || '' }}</div>
          <div class="payment-line">Mode de caution : {{ document.depositPaymentMethod || '' }}</div>

          @if (document.showSignatureFrame || document.customerSignatureDataUrl) {
            <div class="signature-block">
              <div>Signature du client précédée de la mention « Bon pour accord »</div>
              <div class="signature-visual-box" [class.signature-frame-hidden]="!document.showSignatureFrame">
                @if (document.customerSignatureDataUrl) {
                  <img
                    class="signature-image"
                    [src]="document.customerSignatureDataUrl"
                    alt="Signature du client"
                  />
                } @else if (document.showSignatureFrame) {
                  <div class="signature-placeholder">Signature à réaliser sur la tablette</div>
                }
              </div>
            </div>
          }

          <div class="document-end-block">
            <div class="legal-note">
              * Tout matériel dégradé, cassé ou non restitué sera facturé ou retenu sur la caution, sur la base de sa valeur de remplacement.
            </div>

            <div class="footer-line">Fait en 2 exemplaires.</div>
          </div>
        </div>
        <div class="page-counter">Pagination automatique à l’impression</div>
      </div>
    </div>
  `
})
export class RentalDocumentPrintComponent {
  @Input({ required: true }) document!: RentalDocument;

  get depositBreakdown(): Array<{ label: string; quantity: number; unitAmount: number; total: number }> {
    const breakdown = {
      chairs: { label: 'Caution chaises', quantity: 0, unitAmount: 15, total: 0 },
      tables: { label: 'Caution tables', quantity: 0, unitAmount: 40, total: 0 },
      tablecloths: { label: 'Caution nappes', quantity: 0, unitAmount: 16, total: 0 }
    };

    for (const line of this.document.lines) {
      switch (line.itemId) {
        case 'chair-white-folding':
          breakdown.chairs.quantity += line.quantity;
          break;
        case 'table-folding':
          breakdown.tables.quantity += line.quantity;
          break;
        case 'tablecloth':
          breakdown.tablecloths.quantity += line.quantity;
          break;
        case 'special-pack':
          breakdown.tables.quantity += line.quantity;
          breakdown.chairs.quantity += line.quantity * 6;
          break;
        default:
          break;
      }
    }

    return Object.values(breakdown)
      .map((item) => ({
        ...item,
        total: item.quantity * item.unitAmount
      }))
      .filter((item) => item.quantity > 0);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR').format(date);
  }

  formatDepositLabel(label: string, quantity: number, unitAmount: number): string {
    return `${label} (${quantity} × ${this.formatPrice(unitAmount)})`;
  }

  getDepositSummaryLabel(): string {
    switch (this.document.depositPaymentMethod) {
      case 'Espèces':
        return 'Caution en espèces totale';
      case 'Espèces et chèque':
        return 'Caution totale (espèces et chèque)';
      default:
        return 'Chèque de caution total';
    }
  }

  getDepositSummarySuffix(): string {
    if (this.document.depositPaymentMethod === 'Espèces') {
      return '(remise après le retour du matériel complet et sans dégradation)';
    }

    return '(non encaissé, remis après le retour du matériel complet et sans dégradation)';
  }
}

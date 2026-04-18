import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RentalDocumentActions } from '../actions/rental-document.actions';
import { RentalDocument } from '../models/rental-document.model';
import { SignaturePadComponent } from './signature-pad.component';

@Component({
  selector: 'app-customer-signature-section',
  standalone: true,
  imports: [CommonModule, SignaturePadComponent],
  template: `
    <section class="form-section full-width signature-editor-section" [class.signature-stage-card]="emphasized">
      <div class="signature-section-header">
        <div>
          <h3>{{ title }}</h3>
          <p class="field-hint">{{ hint }}</p>
        </div>

        <button type="button" class="secondary-btn signature-clear-btn" (click)="clearSignature()">
          Effacer la signature
        </button>
      </div>

      <app-signature-pad
        [value]="document.customerSignatureDataUrl"
        [onChange]="handleSignatureChange"
      />
    </section>
  `
})
export class CustomerSignatureSectionComponent {
  @Input({ required: true }) document!: RentalDocument;
  @Input() title = 'Signature client';
  @Input() hint = 'Le client peut relire les informations dans l’aperçu puis signer directement sur la tablette.';
  @Input() emphasized = false;
  @Input() inPreviewFlow = false;

  constructor(private readonly actions: RentalDocumentActions) {}

  readonly handleSignatureChange = (signatureDataUrl: string): void => {
    this.actions.updateCustomerSignature(signatureDataUrl);
  };

  clearSignature(): void {
    this.actions.updateCustomerSignature('');
  }
}

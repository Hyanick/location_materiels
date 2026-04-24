import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RentalDocumentActions } from '../actions/rental-document.actions';
import { CustomerSignatureSectionComponent } from './customer-signature-section.component';
import { RENTAL_CATALOG } from '../data/rental-catalog.data';
import { AddressSuggestion } from '../models/address-suggestion.model';
import { AddressAutocompleteService } from '../services/address-autocomplete.service';
import { PdfPreviewService } from '../services/pdf-preview.service';
import { RentalDocumentStore } from '../state/rental-document.store';

@Component({
  selector: 'app-rental-document-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerSignatureSectionComponent],
  template: `
    <div class="panel-card">
      <div class="panel-header">
        <h2>Édition du document</h2>
        <div class="actions-row">
          <button type="button" class="secondary-btn" (click)="resetDocument()">Réinitialiser</button>
          <button type="button" class="primary-btn" (click)="openPdfPreview()">Aperçu PDF</button>
        </div>
      </div>

      <div class="form-grid">
        <section class="form-section">
          <button type="button" class="mobile-section-toggle" [class.expanded]="isSectionExpanded('company')" (click)="toggleMobileSection('company')">
            <span class="mobile-section-title">Société</span>
            <span class="mobile-section-summary">{{ document().company.name || 'Coordonnées société' }}</span>
          </button>

          @if (isSectionExpanded('company')) {
            <div class="mobile-section-content">
              <h3>Société</h3>

              <label>
                <span>Nom</span>
                <input [ngModel]="document().company.name" (ngModelChange)="updateCompanyField('name', $event)" />
              </label>

              <label>
                <span>Adresse</span>
                <input [ngModel]="document().company.address" (ngModelChange)="updateCompanyField('address', $event)" />
              </label>

              <label>
                <span>Ville</span>
                <input [ngModel]="document().company.city" (ngModelChange)="updateCompanyField('city', $event)" />
              </label>

              <label>
                <span>Téléphone</span>
                <input [ngModel]="document().company.phone" (ngModelChange)="updateCompanyField('phone', $event)" />
              </label>

              <label>
                <span>Email</span>
                <input [ngModel]="document().company.email" (ngModelChange)="updateCompanyField('email', $event)" />
              </label>
            </div>
          }
        </section>

        <section class="form-section">
          <button type="button" class="mobile-section-toggle" [class.expanded]="isSectionExpanded('customer')" (click)="toggleMobileSection('customer')">
            <span class="mobile-section-title">Client</span>
            <span class="mobile-section-summary">{{ document().customer.fullName || 'Infos client' }}</span>
          </button>

          @if (isSectionExpanded('customer')) {
            <div class="mobile-section-content">
              <h3>Client</h3>

              <label>
                <span>Nom complet</span>
                <input [ngModel]="document().customer.fullName" (ngModelChange)="updateCustomerField('fullName', $event)" />
              </label>

              <label>
                <span>Adresse</span>
                <div class="autocomplete-field">
                  <input
                    [ngModel]="document().customer.address"
                    (ngModelChange)="handleCustomerAddressInput($event)"
                    (blur)="scheduleAddressSuggestionClose()"
                    autocomplete="street-address"
                  />

                  @if (addressSuggestions().length > 0 && showAddressSuggestions()) {
                    <div class="autocomplete-dropdown">
                      @for (suggestion of addressSuggestions(); track suggestion.label) {
                        <button
                          type="button"
                          class="autocomplete-option"
                          (pointerdown)="handleAddressSuggestionPointerDown($event)"
                          (click)="selectCustomerAddressSuggestion(suggestion)"
                        >
                          <span class="autocomplete-main">{{ suggestion.street }}</span>
                          <span class="autocomplete-meta">{{ suggestion.postalCode }} {{ suggestion.city }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              </label>

              <div class="split-grid">
                <label>
                  <span>Code postal</span>
                  <input [ngModel]="document().customer.postalCode" (ngModelChange)="updateCustomerField('postalCode', $event)" />
                </label>

                <label>
                  <span>Ville</span>
                  <input [ngModel]="document().customer.city" (ngModelChange)="updateCustomerField('city', $event)" />
                </label>
              </div>

              <label>
                <span>Téléphone</span>
                <input [ngModel]="document().customer.phone" (ngModelChange)="updateCustomerField('phone', $event)" />
              </label>

              <label>
                <span>Email</span>
                <input [ngModel]="document().customer.email" (ngModelChange)="updateCustomerField('email', $event)" />
              </label>
            </div>
          }
        </section>

        <section class="form-section full-width">
          <button type="button" class="mobile-section-toggle" [class.expanded]="isSectionExpanded('lines')" (click)="toggleMobileSection('lines')">
            <span class="mobile-section-title">Matériel loué</span>
            <span class="mobile-section-summary">{{ document().lines.length }} ligne{{ document().lines.length > 1 ? 's' : '' }}</span>
          </button>

          @if (isSectionExpanded('lines')) {
            <div class="mobile-section-content">
              <div class="catalog-header">
                <h3>Matériel loué</h3>

                <div class="catalog-actions desktop-catalog-actions">
                  <select [ngModel]="selectedItemId()" (ngModelChange)="selectedItemId.set($event)">
                    <option value="">Choisir un article à ajouter</option>
                    @for (item of catalog; track item.id) {
                      <option [value]="item.id">{{ item.label }} - {{ formatPrice(item.unitPrice) }}</option>
                    }
                  </select>

                  <button type="button" class="primary-btn" (click)="addSelectedItem()" [disabled]="!selectedItemId()">
                    Ajouter la ligne
                  </button>
                </div>

                <div class="mobile-catalog-trigger">
                  <button type="button" class="primary-btn" (click)="openCatalogSheet()">
                    Ajouter un article
                  </button>
                </div>
              </div>

              <div class="lines-table-wrapper">
                <table class="lines-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (document().lines.length === 0) {
                      <tr>
                        <td colspan="5" class="empty-cell">Aucune ligne pour le moment.</td>
                      </tr>
                    }

                    @for (line of document().lines; track $index) {
                      <tr>
                        <td>
                          <input [ngModel]="line.description" (ngModelChange)="updateLineField($index, 'description', $event)" />
                        </td>
                        <td>
                          <input type="number" min="1" [ngModel]="line.quantity" (ngModelChange)="updateLineField($index, 'quantity', toSafeNumber($event, 1))" />
                        </td>
                        <td>
                          <input type="number" min="0" step="0.01" [ngModel]="line.unitPrice" (ngModelChange)="updateLineField($index, 'unitPrice', toSafeNumber($event, 0))" />
                        </td>
                        <td class="line-total">{{ formatPrice(line.total) }}</td>
                        <td>
                          <button type="button" class="danger-btn" (click)="removeLine($index)">Supprimer</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="line-cards">
                @if (document().lines.length === 0) {
                  <div class="line-card-empty">Aucune ligne pour le moment.</div>
                }

                @for (line of document().lines; track $index) {
                  <article class="line-card">
                    <label>
                      <span>Description</span>
                      <input [ngModel]="line.description" (ngModelChange)="updateLineField($index, 'description', $event)" />
                    </label>

                    <div class="line-card-grid">
                      <label>
                        <span>Quantité</span>
                        <input type="number" min="1" [ngModel]="line.quantity" (ngModelChange)="updateLineField($index, 'quantity', toSafeNumber($event, 1))" />
                      </label>

                      <label>
                        <span>Prix unitaire</span>
                        <input type="number" min="0" step="0.01" [ngModel]="line.unitPrice" (ngModelChange)="updateLineField($index, 'unitPrice', toSafeNumber($event, 0))" />
                      </label>
                    </div>

                    <div class="line-card-footer">
                      <div class="line-card-total">
                        <span>Total</span>
                        <strong>{{ formatPrice(line.total) }}</strong>
                      </div>

                      <button type="button" class="danger-btn" (click)="removeLine($index)">Supprimer</button>
                    </div>
                  </article>
                }
              </div>
            </div>
          }
        </section>

        <section class="form-section form-section-wide">
          <button type="button" class="mobile-section-toggle" [class.expanded]="isSectionExpanded('rental')" (click)="toggleMobileSection('rental')">
            <span class="mobile-section-title">Location</span>
            <span class="mobile-section-summary">{{ formatPrice(document().totalAmount) }} · {{ document().paymentMethod }}</span>
          </button>

          @if (isSectionExpanded('rental')) {
            <div class="mobile-section-content">
              <h3>Location</h3>

              <div class="split-grid">
                <label>
                  <span>Date du document</span>
                  <input type="date" [ngModel]="document().documentDate" (ngModelChange)="updateDocumentField('documentDate', $event)" />
                </label>

                <label>
                  <span>Mode paiement</span>
                  <select [ngModel]="document().paymentMethod" (ngModelChange)="updateDocumentField('paymentMethod', $event)">
                    @for (method of paymentMethods; track method) {
                      <option [ngValue]="method">{{ method }}</option>
                    }
                  </select>
                </label>
              </div>

              <div class="split-grid">
                <label>
                  <span>Date retrait</span>
                  <input type="date" [ngModel]="document().pickupDate" (ngModelChange)="updateDocumentField('pickupDate', $event)" />
                </label>

                <label>
                  <span>Date retour</span>
                  <input type="date" [ngModel]="document().returnDate" (ngModelChange)="updateDocumentField('returnDate', $event)" />
                </label>
              </div>

              <div class="split-grid">
                <label>
                  <span>Caution (€)</span>
                  <input type="number" [ngModel]="document().depositAmount" readonly />
                </label>

                <label>
                  <span>Acompte (€)</span>
                  <input type="number" [ngModel]="document().downPayment" (ngModelChange)="updateNumberField('downPayment', $event)" />
                </label>
              </div>

              <label>
                <span>Mode de caution</span>
                <select
                  [ngModel]="document().depositPaymentMethod"
                  (ngModelChange)="updateDocumentField('depositPaymentMethod', $event)"
                >
                  @for (method of depositPaymentMethods; track method) {
                    <option [ngValue]="method">{{ method }}</option>
                  }
                </select>
              </label>

              <label class="toggle-field">
                <input
                  type="checkbox"
                  [ngModel]="document().showSignatureFrame"
                  (ngModelChange)="updateBooleanField('showSignatureFrame', $event)"
                />
                <span>Afficher le cadre de signature sur le document</span>
              </label>

              <p class="field-hint">Caution calculée automatiquement : chaise 15 €, table 40 €, nappe 16 €.</p>

              <label>
                <span>Notes</span>
                <textarea rows="4" [ngModel]="document().notes" (ngModelChange)="updateDocumentField('notes', $event)"></textarea>
              </label>
            </div>
          }
        </section>

        @if (showSignatureSection) {
          <section class="form-section full-width signature-editor-section">
            <button type="button" class="mobile-section-toggle" [class.expanded]="isSectionExpanded('signature')" (click)="toggleMobileSection('signature')">
              <span class="mobile-section-title">Signature</span>
              <span class="mobile-section-summary">{{ document().customerSignatureDataUrl ? 'Signature enregistrée' : 'Signature à compléter' }}</span>
            </button>

            @if (isSectionExpanded('signature')) {
              <div class="mobile-section-content">
                <app-customer-signature-section
                  [document]="document()"
                  [title]="'Signature client'"
                  [hint]="'Le client peut relire les informations dans l’aperçu à droite puis signer directement sur la tablette.'"
                />
              </div>
            }
          </section>
        }
      </div>

      <div class="summary-box mobile-summary-box">
        <div><strong>Total :</strong> {{ formatPrice(document().totalAmount) }}</div>
        <div><strong>Solde :</strong> {{ formatPrice(document().balanceDue) }}</div>
        <button type="button" class="primary-btn mobile-summary-action" (click)="openPdfPreview()">Aperçu PDF</button>
      </div>

      @if (isPhoneViewport() && isCatalogSheetOpen()) {
        <div class="mobile-sheet-overlay" (click)="closeCatalogSheet()">
          <div class="mobile-sheet" (click)="$event.stopPropagation()">
            <div class="mobile-sheet-handle"></div>
            <div class="mobile-sheet-header">
              <div>
                <h3>Ajouter une ligne</h3>
                <p>Choisis un article du catalogue puis ajoute-le au document.</p>
              </div>

              <button type="button" class="secondary-btn" (click)="closeCatalogSheet()">Fermer</button>
            </div>

            <div class="mobile-sheet-body">
              <label>
                <span>Article</span>
                <select [ngModel]="selectedItemId()" (ngModelChange)="selectedItemId.set($event)">
                  <option value="">Choisir un article à ajouter</option>
                  @for (item of catalog; track item.id) {
                    <option [value]="item.id">{{ item.label }} - {{ formatPrice(item.unitPrice) }}</option>
                  }
                </select>
              </label>

              <button type="button" class="primary-btn" (click)="addSelectedItem()" [disabled]="!selectedItemId()">
                Ajouter la ligne
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RentalDocumentFormComponent implements OnDestroy {
  @Input() showSignatureSection = true;

  private readonly actions = inject(RentalDocumentActions);
  private readonly store = inject(RentalDocumentStore);
  private readonly addressAutocompleteService = inject(AddressAutocompleteService);
  private readonly pdfPreviewService = inject(PdfPreviewService);
  private addressSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private addressSearchAbortController: AbortController | null = null;
  private addressSuggestionCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly catalog = RENTAL_CATALOG;
  readonly document = computed(() => this.store.document());
  readonly viewportWidth = signal(typeof window === 'undefined' ? 1280 : window.innerWidth);
  readonly isPhoneViewport = computed(() => this.viewportWidth() <= 560);
  readonly selectedItemId = signal('');
  readonly isCatalogSheetOpen = signal(false);
  readonly openMobileSection = signal<'company' | 'customer' | 'rental' | 'lines' | 'signature' | null>('customer');
  readonly addressSuggestions = signal<AddressSuggestion[]>([]);
  readonly showAddressSuggestions = signal(false);
  readonly paymentMethods = ['Espèces', 'Chèque', 'Espèces et chèque'];
  readonly depositPaymentMethods = ['Chèque', 'Espèces', 'Espèces et chèque'];

  @HostListener('window:resize')
  handleViewportResize(): void {
    this.viewportWidth.set(window.innerWidth);

    if (!this.isPhoneViewport()) {
      this.isCatalogSheetOpen.set(false);
    }
  }

  updateCompanyField(field: 'name' | 'address' | 'city' | 'phone' | 'email', value: string): void {
    this.actions.updateCompanyField(field, value);
  }

  updateCustomerField(
    field: 'fullName' | 'address' | 'postalCode' | 'city' | 'phone' | 'email',
    value: string
  ): void {
    this.actions.updateCustomerField(field, value);
  }

  handleCustomerAddressInput(value: string): void {
    this.updateCustomerField('address', value);
    this.showAddressSuggestions.set(true);
    this.queueAddressSearch(value);
  }

  selectCustomerAddressSuggestion(suggestion: AddressSuggestion): void {
    this.clearAddressSuggestionCloseTimer();
    this.actions.patchCustomer({
      address: suggestion.street,
      postalCode: suggestion.postalCode,
      city: suggestion.city
    });
    this.addressSuggestions.set([]);
    this.showAddressSuggestions.set(false);
  }

  scheduleAddressSuggestionClose(): void {
    this.clearAddressSuggestionCloseTimer();
    this.addressSuggestionCloseTimer = setTimeout(() => {
      this.showAddressSuggestions.set(false);
    }, 250);
  }

  handleAddressSuggestionPointerDown(event: PointerEvent): void {
    event.preventDefault();
    this.clearAddressSuggestionCloseTimer();
  }

  updateDocumentField(
    field: 'documentDate' | 'pickupDate' | 'returnDate' | 'paymentMethod' | 'depositPaymentMethod' | 'notes',
    value: string
  ): void {
    this.actions.updateDocumentField(field, value);
  }

  updateNumberField(field: 'downPayment', value: string | number): void {
    this.actions.updateDocumentField(field, this.toSafeNumber(value, 0));
  }

  updateBooleanField(field: 'showSignatureFrame', value: boolean): void {
    this.actions.updateDocumentField(field, Boolean(value));
  }

  addSelectedItem(): void {
    const itemId = this.selectedItemId();

    if (!itemId) {
      return;
    }

    this.actions.addLineByItemId(itemId);
    this.selectedItemId.set('');
    this.isCatalogSheetOpen.set(false);
  }

  openCatalogSheet(): void {
    this.isCatalogSheetOpen.set(true);
  }

  closeCatalogSheet(): void {
    this.isCatalogSheetOpen.set(false);
  }

  toggleMobileSection(section: 'company' | 'customer' | 'rental' | 'lines' | 'signature'): void {
    if (!this.isPhoneViewport()) {
      return;
    }

    this.openMobileSection.set(this.openMobileSection() === section ? null : section);
  }

  isSectionExpanded(section: 'company' | 'customer' | 'rental' | 'lines' | 'signature'): boolean {
    return !this.isPhoneViewport() || this.openMobileSection() === section;
  }

  updateLineField(index: number, field: 'description' | 'quantity' | 'unitPrice' | 'itemId' | 'total', value: string | number): void {
    this.actions.updateLineField(index, field, value);
  }

  removeLine(index: number): void {
    this.actions.removeLine(index);
  }

  resetDocument(): void {
    this.resetAddressAutocompleteState();
    this.actions.resetDocument();
  }

  async openPdfPreview(): Promise<void> {
    await this.pdfPreviewService.openPreview(this.buildPdfFileName());
  }

  toSafeNumber(value: string | number, fallback: number): number {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  private buildPdfFileName(): string {
    const customerName = (this.document().customer.fullName || 'client')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '');

    const now = new Date();
    const datePart = [
      String(now.getDate()).padStart(2, '0'),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getFullYear())
    ].join('-');
    const timePart = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

    return `Bon_Location_Matériel_pour_${customerName}_du_${datePart}_à_${timePart}.pdf`;
  }

  ngOnDestroy(): void {
    this.resetAddressAutocompleteState();
  }

  private queueAddressSearch(query: string): void {
    if (this.addressSearchTimer) {
      clearTimeout(this.addressSearchTimer);
    }

    if (query.trim().length < 3) {
      this.cancelAddressSearch();
      this.addressSuggestions.set([]);
      return;
    }

    this.addressSearchTimer = setTimeout(() => {
      this.fetchAddressSuggestions(query);
    }, 250);
  }

  private async fetchAddressSuggestions(query: string): Promise<void> {
    this.cancelAddressSearch();
    this.addressSearchAbortController = new AbortController();

    try {
      const suggestions = await this.addressAutocompleteService.searchAddresses(
        query,
        this.addressSearchAbortController.signal
      );

      if (this.document().customer.address.trim() !== query.trim()) {
        return;
      }

      this.addressSuggestions.set(suggestions);
      this.showAddressSuggestions.set(suggestions.length > 0);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      this.addressSuggestions.set([]);
      this.showAddressSuggestions.set(false);
    }
  }

  private cancelAddressSearch(): void {
    if (this.addressSearchAbortController) {
      this.addressSearchAbortController.abort();
      this.addressSearchAbortController = null;
    }
  }

  private clearAddressSuggestionCloseTimer(): void {
    if (this.addressSuggestionCloseTimer) {
      clearTimeout(this.addressSuggestionCloseTimer);
      this.addressSuggestionCloseTimer = null;
    }
  }

  private resetAddressAutocompleteState(): void {
    if (this.addressSearchTimer) {
      clearTimeout(this.addressSearchTimer);
      this.addressSearchTimer = null;
    }

    this.clearAddressSuggestionCloseTimer();
    this.cancelAddressSearch();
    this.addressSuggestions.set([]);
    this.showAddressSuggestions.set(false);
  }
}

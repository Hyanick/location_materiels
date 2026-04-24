import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RentalDocumentActions } from '../actions/rental-document.actions';
import { CustomerSignatureSectionComponent } from '../components/customer-signature-section.component';
import { PdfPreviewModalComponent } from '../components/pdf-preview-modal.component';
import { RentalDocumentFormComponent } from '../components/rental-document-form.component';
import { RentalDocumentPrintComponent } from '../components/rental-document-print.component';
import { RentalDocumentProvider } from '../providers/rental-document.provider';
import { NetworkStatusService } from '../services/network-status.service';
import { PdfPreviewService } from '../services/pdf-preview.service';
import { RentalDocumentStore } from '../state/rental-document.store';

@Component({
  selector: 'app-rental-document-page',
  standalone: true,
  imports: [CommonModule, RentalDocumentFormComponent, RentalDocumentPrintComponent, CustomerSignatureSectionComponent, PdfPreviewModalComponent],
  template: `
    <div class="page-shell" [class.phone-shell]="isPhoneViewport()">
      <header class="topbar no-print">
        <div class="topbar-content">
          <div>
            <h1>{{ isPhoneViewport() ? 'Bon de location' : 'Créateur de bon de location' }}</h1>
            <p>
              @if (isPhoneViewport()) {
                Prépare, relis et exporte le document.
              } @else {
                Mode desktop pour la saisie PC, mode tablette pour relire et signer au client
              }
            </p>
          </div>

          @if (!isPhoneViewport()) {
            <div class="mode-switch" role="radiogroup" aria-label="Mode d'utilisation">
            <button
              type="button"
              class="mode-chip"
              [class.active]="viewMode() === 'desktop'"
              (click)="setViewMode('desktop')"
            >
              Desktop
            </button>
            <button
              type="button"
              class="mode-chip"
              [class.active]="viewMode() === 'tablet'"
              (click)="setViewMode('tablet')"
            >
              Tablette
            </button>
            </div>
          }
        </div>
      </header>

      @if (viewMode() === 'desktop') {
        <main class="page-content">
          <section class="left-panel no-print">
            <app-rental-document-form />
          </section>

          <section class="right-panel">
            <div class="tablet-preview-banner no-print">
              <div class="tablet-preview-copy">
                <strong>Zone client</strong>
                <span>Le document reste imprimable depuis un PC et la signature reste optionnelle.</span>
              </div>
            </div>
            <section class="email-stage-card no-print">
              <div class="email-stage-header">
                <div>
                  <h3>Envoi au client</h3>
                  <p>Ouvre un brouillon d’e-mail à l’adresse du client. Le PDF doit ensuite être joint depuis l’application mail.</p>
                </div>

                <button type="button" class="primary-btn" (click)="openCustomerEmailDraft()" [disabled]="!canOpenCustomerEmail()">
                  {{ isOnline() ? 'Ouvrir l’e-mail' : 'Mettre en attente' }}
                </button>
              </div>

              <div class="email-stage-details">
                <div><strong>Destinataire :</strong> {{ document().customer.email || 'Adresse e-mail client manquante' }}</div>
                <div><strong>Objet :</strong> {{ getCustomerEmailSubject() }}</div>
                <div><strong>Réseau :</strong> {{ isOnline() ? 'Connecté' : 'Hors ligne' }}</div>
                <div><strong>Statut :</strong> {{ getEmailStatusLabel() }}</div>
                @if (document().emailDelivery.lastAttemptAt) {
                  <div><strong>Dernière action :</strong> {{ formatDateTime(document().emailDelivery.lastAttemptAt) }}</div>
                }
                @if (document().emailDelivery.lastError) {
                  <div><strong>Erreur :</strong> {{ document().emailDelivery.lastError }}</div>
                }
              </div>
            </section>
            <app-rental-document-print [document]="document()" />
          </section>
        </main>
      } @else {
        <main class="tablet-shell no-print">
          <section class="tablet-stage-card">
            <div class="tablet-stage-header">
              <div>
                <h2>{{ getTabletStepTitle() }}</h2>
                <p>{{ getTabletStepDescription() }}</p>
              </div>

              @if (isPhoneViewport()) {
                <div class="mobile-step-breadcrumb" role="tablist" aria-label="Étapes mobile">
                  <div class="mobile-step-count">Étape {{ getCurrentTabletStepIndex() }} sur {{ tabletSteps.length }}</div>
                  <div class="mobile-step-track">
                    @for (step of tabletSteps; track step.id; let isLast = $last) {
                      <button
                        type="button"
                        class="mobile-step-link"
                        [class.active]="tabletStep() === step.id"
                        [class.done]="isTabletStepDone(step.id)"
                        [class.future]="isTabletStepFuture(step.id)"
                        (click)="tabletStep.set(step.id)"
                      >
                        {{ step.label }}
                      </button>
                      @if (!isLast) {
                        <span class="mobile-step-separator">›</span>
                      }
                    }
                  </div>
                </div>
              } @else {
                <div class="tablet-stepper" role="tablist" aria-label="Étapes tablette">
                  @for (step of tabletSteps; track step.id) {
                    <button
                      type="button"
                      class="tablet-step"
                      [class.active]="tabletStep() === step.id"
                      (click)="tabletStep.set(step.id)"
                    >
                      <span>{{ step.index }}</span>
                      <strong>{{ step.label }}</strong>
                    </button>
                  }
                </div>
              }
            </div>

            @if (tabletStep() === 'form') {
              <app-rental-document-form [showSignatureSection]="false" />
            }

            @if (tabletStep() === 'review') {
              <div class="tablet-review-layout">
                <div class="tablet-preview-banner">
                  <div class="tablet-preview-copy">
                    <strong>Lecture client</strong>
                    <span>Fais défiler le document avec le client puis écris “Bon pour accord” et signe juste en dessous.</span>
                  </div>
                </div>

                <div class="tablet-preview-frame">
                  <app-rental-document-print [document]="document()" />
                </div>

                <app-customer-signature-section
                  [document]="document()"
                  [title]="'Bon pour accord et signature'"
                  [hint]="'Après lecture, le client peut écrire “Bon pour accord” puis signer directement ici au stylet ou au doigt.'"
                  [emphasized]="true"
                  [inPreviewFlow]="true"
                />
              </div>
            }

            @if (tabletStep() === 'signature') {
              <div class="tablet-signature-layout">
                <div class="tablet-preview-banner">
                  <div class="tablet-preview-copy">
                    <strong>Signature au stylet</strong>
                    <span>Le client relit les dernières informations puis signe dans une zone plus large.</span>
                  </div>
                </div>

                <app-customer-signature-section
                  [document]="document()"
                  [title]="'Signature au stylet'"
                  [hint]="'Utilise le stylet ou le doigt. La signature sera reprise dans le document imprimable.'"
                  [emphasized]="true"
                />

                <div class="tablet-preview-frame">
                  <app-rental-document-print [document]="document()" />
                </div>
              </div>
            }

            @if (tabletStep() === 'email') {
              <section class="email-stage-card">
                <div class="email-stage-header">
                  <div>
                    <h3>Envoyer le document</h3>
                    <p>Ouvre le brouillon d’e-mail du client. Attache ensuite le PDF généré depuis l’application de messagerie.</p>
                  </div>

                  <button type="button" class="primary-btn" (click)="openCustomerEmailDraft()" [disabled]="!canOpenCustomerEmail()">
                    {{ isOnline() ? 'Ouvrir l’e-mail' : 'Mettre en attente' }}
                  </button>
                </div>

                <div class="email-stage-details">
                  <div><strong>Destinataire :</strong> {{ document().customer.email || 'Adresse e-mail client manquante' }}</div>
                  <div><strong>Objet :</strong> {{ getCustomerEmailSubject() }}</div>
                  <div><strong>Réseau :</strong> {{ isOnline() ? 'Connecté' : 'Hors ligne' }}</div>
                  <div><strong>Statut :</strong> {{ getEmailStatusLabel() }}</div>
                  @if (document().emailDelivery.lastAttemptAt) {
                    <div><strong>Dernière action :</strong> {{ formatDateTime(document().emailDelivery.lastAttemptAt) }}</div>
                  }
                  @if (document().emailDelivery.lastError) {
                    <div><strong>Erreur :</strong> {{ document().emailDelivery.lastError }}</div>
                  }
                </div>

                <div class="email-stage-actions">
                  <button type="button" class="secondary-btn" (click)="openPdfPreview()">
                    Aperçu PDF
                  </button>
                  @if (isOnline() && document().emailDelivery.status === 'pending') {
                    <button type="button" class="secondary-btn" (click)="openCustomerEmailDraft()">
                      Ouvrir l’e-mail
                    </button>
                  }
                </div>
              </section>
            }

            <div class="tablet-bottom-bar">
              <button type="button" class="secondary-btn" (click)="goToPreviousTabletStep()" [disabled]="tabletStep() === 'form'">
                Étape précédente
              </button>

              <button type="button" class="primary-btn" (click)="goToNextTabletStep()">
                {{ getTabletNextLabel() }}
              </button>
            </div>
          </section>
        </main>

        <section class="right-panel tablet-print-panel">
          <app-rental-document-print [document]="document()" />
        </section>
      }

      <app-pdf-preview-modal />
    </div>
  `,
  styles: [``]
})
export class RentalDocumentPageComponent {
  private readonly actions = inject(RentalDocumentActions);
  private readonly provider = inject(RentalDocumentProvider);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly pdfPreviewService = inject(PdfPreviewService);
  private readonly store = inject(RentalDocumentStore);

  /**
   * Exposition du document courant à l'aperçu.
   */
  readonly document = computed(() => this.store.document());
  readonly isOnline = computed(() => this.networkStatus.isOnline());
  readonly viewportWidth = signal(typeof window === 'undefined' ? 1280 : window.innerWidth);
  readonly isPhoneViewport = computed(() => this.viewportWidth() <= 560);
  readonly viewMode = signal<'desktop' | 'tablet'>(this.getInitialViewMode());
  readonly tabletStep = signal<'form' | 'review' | 'signature' | 'email'>('form');
  readonly tabletSteps = [
    { id: 'form', index: '1', label: 'Saisie' },
    { id: 'review', index: '2', label: 'Relecture' },
    { id: 'signature', index: '3', label: 'Signature' },
    { id: 'email', index: '4', label: 'E-mail' }
  ] as const;

  /**
   * Injection volontaire du provider pour déclencher l'initialisation.
   */
  protected readonly _provider = this.provider;

  @HostListener('window:resize')
  handleViewportResize(): void {
    this.viewportWidth.set(window.innerWidth);

    if (this.isPhoneViewport() && this.viewMode() !== 'tablet') {
      this.viewMode.set('tablet');
      this.tabletStep.set('form');
    }
  }

  setViewMode(mode: 'desktop' | 'tablet'): void {
    if (this.isPhoneViewport()) {
      this.viewMode.set('tablet');
      this.tabletStep.set('form');
      return;
    }

    this.viewMode.set(mode);

    if (mode === 'desktop') {
      this.tabletStep.set('form');
    }
  }

  goToPreviousTabletStep(): void {
    switch (this.tabletStep()) {
      case 'review':
        this.tabletStep.set('form');
        break;
      case 'signature':
        this.tabletStep.set('review');
        break;
      case 'email':
        this.tabletStep.set('signature');
        break;
      default:
        break;
    }
  }

  goToNextTabletStep(): void {
    switch (this.tabletStep()) {
      case 'form':
        this.tabletStep.set('review');
        break;
      case 'review':
        this.tabletStep.set('signature');
        break;
      case 'signature':
        this.tabletStep.set('email');
        break;
      case 'email':
        void this.openPdfPreview();
        break;
      default:
        break;
    }
  }

  getTabletStepTitle(): string {
    switch (this.tabletStep()) {
      case 'review':
        return 'Relecture du document';
      case 'signature':
        return 'Validation et signature';
      case 'email':
        return 'Envoi par e-mail';
      default:
        return 'Saisie du document';
    }
  }

  getTabletStepDescription(): string {
    if (this.isPhoneViewport()) {
      switch (this.tabletStep()) {
        case 'review':
          return 'Relis avec le client avant validation.';
        case 'signature':
          return 'Le client signe directement sur le téléphone.';
        case 'email':
          return 'Prépare l’envoi du document.';
        default:
          return 'Complète les champs essentiels.';
      }
    }

    switch (this.tabletStep()) {
      case 'review':
        return 'Présente le document au client dans un format lisible avant validation.';
      case 'signature':
        return 'Le client signe directement sur la tablette avec le stylet ou le doigt.';
      case 'email':
        return 'Prépare l’envoi du document au client depuis l’application de messagerie.';
      default:
        return 'Prépare le document comme sur PC, avec des champs adaptés au tactile.';
    }
  }

  getTabletNextLabel(): string {
    return this.tabletStep() === 'email' ? 'Imprimer / PDF' : 'Étape suivante';
  }

  getCurrentTabletStepIndex(): number {
    return this.tabletSteps.findIndex((step) => step.id === this.tabletStep()) + 1;
  }

  isTabletStepDone(stepId: 'form' | 'review' | 'signature' | 'email'): boolean {
    return this.getTabletStepOrder(stepId) < this.getTabletStepOrder(this.tabletStep());
  }

  isTabletStepFuture(stepId: 'form' | 'review' | 'signature' | 'email'): boolean {
    return this.getTabletStepOrder(stepId) > this.getTabletStepOrder(this.tabletStep());
  }

  getEmailStatusLabel(): string {
    switch (this.document().emailDelivery.status) {
      case 'pending':
        return 'En attente d’envoi';
      case 'sent':
        return 'Envoyé';
      case 'failed':
        return 'Échec d’envoi';
      default:
        return 'Brouillon local';
    }
  }

  canOpenCustomerEmail(): boolean {
    return this.document().customer.email.trim().length > 0;
  }

  getCustomerEmailSubject(): string {
    const customerName = this.document().customer.fullName.trim() || 'client';
    return `Votre bon de location - ${customerName}`;
  }

  openCustomerEmailDraft(): void {
    const email = this.document().customer.email.trim();

    if (!email) {
      this.actions.updateEmailDelivery('failed', { lastError: 'Adresse e-mail client manquante.' });
      return;
    }

    if (!this.isOnline()) {
      this.actions.updateEmailDelivery('pending');
      return;
    }

    const customerName = this.document().customer.fullName.trim() || 'client';
    const companyName = this.document().company.name.trim() || 'notre société';
    const body = [
      `Bonjour ${customerName},`,
      '',
      'Veuillez trouver votre bon de location en pièce jointe.',
      '',
      `Cordialement,`,
      companyName
    ].join('\n');

    this.actions.updateEmailDelivery('pending');
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(this.getCustomerEmailSubject())}&body=${encodeURIComponent(body)}`;
  }

  async openPdfPreview(): Promise<void> {
    await this.pdfPreviewService.openPreview(this.buildPdfFileName());
  }

  formatDateTime(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
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

  private getInitialViewMode(): 'desktop' | 'tablet' {
    if (typeof window !== 'undefined' && window.innerWidth <= 560) {
      return 'tablet';
    }

    return 'desktop';
  }

  private getTabletStepOrder(stepId: 'form' | 'review' | 'signature' | 'email'): number {
    return this.tabletSteps.findIndex((step) => step.id === stepId);
  }
}

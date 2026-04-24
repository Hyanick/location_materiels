import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { PdfPreviewService } from '../services/pdf-preview.service';

@Component({
  selector: 'app-pdf-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (preview.isOpen()) {
      <div class="pdf-preview-overlay no-print" (click)="preview.close()">
        <div class="pdf-preview-dialog" (click)="$event.stopPropagation()">
          <div class="pdf-preview-header">
            <div>
              <h2>Aperçu PDF</h2>
              @if (!isPhoneViewport()) {
                <p>Prévisualise le document, retire les pages inutiles puis télécharge le PDF ou des images prêtes à envoyer.</p>
              }
            </div>

            <button type="button" class="secondary-btn" (click)="preview.close()">Fermer</button>
          </div>

          @if (isPhoneViewport()) {
            <div class="pdf-preview-mobile-nav">
              @for (pageNumber of preview.getPageNumbers(); track pageNumber) {
                <div
                  class="pdf-page-toggle pdf-page-toggle-mobile"
                  [class.active]="preview.currentPageIndex() === pageNumber - 1"
                  (click)="preview.setCurrentPage(pageNumber - 1)"
                >
                  <input
                    type="checkbox"
                    [checked]="preview.selectedPages().includes(pageNumber - 1)"
                    (click)="$event.stopPropagation()"
                    (change)="togglePage(pageNumber - 1, $any($event.target).checked)"
                  />
                  <span>Page {{ pageNumber }}</span>
                </div>
              }
            </div>

            <div class="pdf-preview-canvas pdf-preview-canvas-mobile">
              @if (preview.isLoading()) {
                <div class="pdf-preview-state">Préparation du PDF...</div>
              } @else if (preview.errorMessage()) {
                <div class="pdf-preview-state pdf-preview-error">{{ preview.errorMessage() }}</div>
              } @else {
                <figure class="pdf-preview-page-card pdf-preview-page-card-mobile">
                  <div class="pdf-preview-page-label">Page {{ preview.currentPageIndex() + 1 }}</div>
                  <img class="pdf-preview-page-image" [src]="preview.getCurrentPreviewUrl()" [alt]="'Prévisualisation page ' + (preview.currentPageIndex() + 1)" />
                </figure>
              }
            </div>
          } @else {
            <div class="pdf-preview-body">
              <aside class="pdf-preview-sidebar">
                <h3>Pages</h3>

                @for (pageNumber of preview.getPageNumbers(); track pageNumber) {
                  <label class="pdf-page-toggle">
                    <input
                      type="checkbox"
                      [checked]="preview.selectedPages().includes(pageNumber - 1)"
                      (change)="togglePage(pageNumber - 1, $any($event.target).checked)"
                    />
                    <span>Page {{ pageNumber }}</span>
                  </label>
                }
              </aside>

              <div class="pdf-preview-canvas">
                @if (preview.isLoading()) {
                  <div class="pdf-preview-state">Préparation du PDF...</div>
                } @else if (preview.errorMessage()) {
                  <div class="pdf-preview-state pdf-preview-error">{{ preview.errorMessage() }}</div>
                } @else {
                  <div class="pdf-preview-pages">
                    @for (pageUrl of preview.getVisiblePreviewUrls(); track pageUrl; let pageIndex = $index) {
                      <figure class="pdf-preview-page-card">
                        <div class="pdf-preview-page-label">Page {{ pageIndex + 1 }}</div>
                        <img class="pdf-preview-page-image" [src]="pageUrl" [alt]="'Prévisualisation page ' + (pageIndex + 1)" />
                      </figure>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <div class="pdf-preview-footer">
            <button type="button" class="secondary-btn" (click)="preview.print()" [disabled]="!preview.hasSelection() || preview.isLoading()">
              Imprimer
            </button>
            <button type="button" class="secondary-btn" (click)="downloadImages()" [disabled]="!preview.hasSelection() || preview.isLoading()">
              Télécharger image{{ preview.selectedPages().length > 1 ? 's' : '' }}
            </button>
            <button type="button" class="primary-btn" (click)="download()" [disabled]="!preview.hasSelection() || preview.isLoading()">
              Télécharger PDF
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PdfPreviewModalComponent {
  readonly preview = inject(PdfPreviewService);
  readonly viewportWidth = signal(typeof window === 'undefined' ? 1280 : window.innerWidth);

  @HostListener('window:resize')
  handleResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  isPhoneViewport(): boolean {
    return this.viewportWidth() <= 560;
  }

  async togglePage(pageIndex: number, checked: boolean): Promise<void> {
    await this.preview.togglePage(pageIndex, checked);
  }

  async toggleCurrentPage(): Promise<void> {
    await this.preview.togglePage(this.preview.currentPageIndex(), !this.preview.isCurrentPageSelected());
  }

  async download(): Promise<void> {
    await this.preview.download();
  }

  async downloadImages(): Promise<void> {
    await this.preview.downloadImages();
  }
}

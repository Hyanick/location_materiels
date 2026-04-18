import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
              <p>Prévisualise le document, retire les pages inutiles puis télécharge ou imprime le PDF final.</p>
            </div>

            <button type="button" class="secondary-btn" (click)="preview.close()">Fermer</button>
          </div>

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

          <div class="pdf-preview-footer">
            <button type="button" class="secondary-btn" (click)="preview.print()" [disabled]="!preview.hasSelection() || preview.isLoading()">
              Imprimer
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

  async togglePage(pageIndex: number, checked: boolean): Promise<void> {
    await this.preview.togglePage(pageIndex, checked);
  }

  async download(): Promise<void> {
    await this.preview.download();
  }
}

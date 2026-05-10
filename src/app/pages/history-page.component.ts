import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RentalDocumentActions } from '../actions/rental-document.actions';
import { LocationSubnavComponent } from '../components/location-subnav.component';
import { RentalDocumentPrintComponent } from '../components/rental-document-print.component';
import { RentalDocument } from '../models/rental-document.model';
import { PdfExportService } from '../services/pdf-export.service';
import { RentalHistoryEntry, RentalStorageService } from '../services/rental-storage.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationSubnavComponent, RentalDocumentPrintComponent],
  template: `
    <main class="admin-page">
      <app-location-subnav />
      <section class="admin-hero">
        <p class="tools-kicker">Historique</p>
        <h1>Bons de location</h1>
        <p>Recherche, restaure ou duplique un bon déjà préparé.</p>
      </section>

      <section class="admin-card admin-wide">
        <input class="search-input" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Rechercher par client, date ou montant" />
        <div class="admin-list">
          @for (entry of filteredHistory(); track entry.id) {
            <article class="admin-row">
              <div>
                <strong>{{ entry.customerName }}</strong>
                <span>{{ formatDate(entry.savedAt) }} · {{ formatPrice(entry.totalAmount) }}</span>
              </div>
              <div class="row-actions">
                <button type="button" class="secondary-btn" (click)="restore(entry)">Restaurer</button>
                <button type="button" class="primary-btn" (click)="duplicate(entry)">Dupliquer</button>
                <button type="button" class="secondary-btn" (click)="exportPdf(entry)">PDF</button>
                <button type="button" class="danger-btn" (click)="delete(entry)">Supprimer</button>
              </div>
            </article>
          } @empty {
            <div class="empty-admin">Aucun bon en historique.</div>
          }
        </div>
      </section>

      @if (exportDocument()) {
        <div class="history-export-host">
          <app-rental-document-print [document]="exportDocument()!" />
        </div>
      }
    </main>
  `
})
export class HistoryPageComponent {
  private readonly actions = inject(RentalDocumentActions);
  private readonly pdfExportService = inject(PdfExportService);
  private readonly router = inject(Router);
  private readonly storage = inject(RentalStorageService);
  private readonly toast = inject(ToastService);
  readonly history = signal<RentalHistoryEntry[]>(this.storage.readHistory());
  readonly exportDocument = signal<RentalDocument | null>(null);
  readonly query = signal('');
  readonly filteredHistory = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.history().filter((entry) => {
      const haystack = `${entry.customerName} ${entry.savedAt} ${entry.totalAmount}`.toLowerCase();
      return !query || haystack.includes(query);
    });
  });

  restore(entry: RentalHistoryEntry): void {
    this.actions.restoreDocument(entry.document);
    this.toast.success('Bon restauré.');
    void this.router.navigateByUrl('/location');
  }

  duplicate(entry: RentalHistoryEntry): void {
    this.actions.restoreDocument({
      ...entry.document,
      documentDate: new Date().toISOString().slice(0, 10),
      customerSignatureDataUrl: ''
    });
    this.toast.success('Bon dupliqué.');
    void this.router.navigateByUrl('/location');
  }

  delete(entry: RentalHistoryEntry): void {
    this.storage.deleteHistoryEntry(entry.id);
    this.history.set(this.storage.readHistory());
    this.toast.success('Bon supprimé.');
  }

  async exportPdf(entry: RentalHistoryEntry): Promise<void> {
    this.exportDocument.set(entry.document);
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    await this.pdfExportService.exportVisiblePrintPage(this.buildPdfFileName(entry));
    this.exportDocument.set(null);
    this.toast.success('PDF exporté depuis l’historique.');
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }

  private buildPdfFileName(entry: RentalHistoryEntry): string {
    const customerName = entry.customerName.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '') || 'client';
    return `Bon_Location_${customerName}.pdf`;
  }
}

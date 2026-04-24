import { Injectable, computed, signal } from '@angular/core';
import { PdfExportService } from './pdf-export.service';

@Injectable()
export class PdfPreviewService {
  readonly isOpen = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly totalPages = signal(0);
  readonly selectedPages = signal<number[]>([]);
  readonly pagePreviewUrls = signal<string[]>([]);
  readonly currentPageIndex = signal(0);
  readonly hasSelection = computed(() => this.selectedPages().length > 0);

  private basePdfBytes: Uint8Array | null = null;
  private fileName = 'bon-location.pdf';

  constructor(private readonly pdfExportService: PdfExportService) {}

  async openPreview(fileName = 'bon-location.pdf'): Promise<void> {
    this.fileName = fileName;
    this.isOpen.set(true);
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const renderResult = await this.pdfExportService.buildRenderResult();
      this.basePdfBytes = renderResult.basePdfBytes;
      const totalPages = renderResult.pagePreviewUrls.length;
      const selectedPages = Array.from({ length: totalPages }, (_, index) => index);

      this.totalPages.set(totalPages);
      this.selectedPages.set(selectedPages);
      this.pagePreviewUrls.set(renderResult.pagePreviewUrls);
      this.currentPageIndex.set(0);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Prévisualisation PDF impossible.');
    } finally {
      this.isLoading.set(false);
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.isLoading.set(false);
    this.errorMessage.set('');
    this.totalPages.set(0);
    this.selectedPages.set([]);
    this.pagePreviewUrls.set([]);
    this.currentPageIndex.set(0);
    this.basePdfBytes = null;
  }

  async togglePage(pageIndex: number, checked: boolean): Promise<void> {
    const nextSelection = checked
      ? [...this.selectedPages(), pageIndex].sort((left, right) => left - right)
      : this.selectedPages().filter((index) => index !== pageIndex);

    this.selectedPages.set(nextSelection);
  }

  async download(): Promise<void> {
    const pdfBytes = await this.buildCurrentPdf();
    this.pdfExportService.downloadPdf(pdfBytes, this.fileName);
  }

  async downloadImages(): Promise<void> {
    const selectedPages = this.selectedPages();

    if (selectedPages.length === 0) {
      throw new Error('Sélectionne au moins une page.');
    }

    const previewUrls = this.pagePreviewUrls();
    const fileBaseName = this.getFileBaseName();

    selectedPages.forEach((pageIndex, orderIndex) => {
      const imageUrl = previewUrls[pageIndex];

      if (!imageUrl) {
        return;
      }

      const link = document.createElement('a');
      const pageNumber = orderIndex + 1;

      link.href = imageUrl;
      link.download = `${fileBaseName}-page-${pageNumber}.png`;
      link.click();
    });
  }

  print(): void {
    void this.printSelectedPdf();
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  }

  setCurrentPage(pageIndex: number): void {
    const boundedIndex = Math.max(0, Math.min(pageIndex, this.totalPages() - 1));
    this.currentPageIndex.set(boundedIndex);
  }

  showNextPage(): void {
    this.setCurrentPage(this.currentPageIndex() + 1);
  }

  showPreviousPage(): void {
    this.setCurrentPage(this.currentPageIndex() - 1);
  }

  getCurrentPreviewUrl(): string {
    return this.pagePreviewUrls()[this.currentPageIndex()] ?? '';
  }

  isCurrentPageSelected(): boolean {
    return this.selectedPages().includes(this.currentPageIndex());
  }

  getVisiblePreviewUrls(): string[] {
    return this.selectedPages()
      .map((pageIndex) => this.pagePreviewUrls()[pageIndex])
      .filter((value): value is string => Boolean(value));
  }

  getSelectedPageNumbers(): number[] {
    return this.selectedPages().map((pageIndex) => pageIndex + 1);
  }

  private async buildCurrentPdf(): Promise<Uint8Array> {
    if (!this.basePdfBytes) {
      throw new Error('Base PDF indisponible.');
    }

    if (this.selectedPages().length === 0) {
      throw new Error('Sélectionne au moins une page.');
    }

    return this.pdfExportService.rebuildPdfFromBase(this.basePdfBytes, this.selectedPages());
  }

  private async countPages(pdfBytes: Uint8Array): Promise<number> {
    const pdf = await (await import('pdf-lib')).PDFDocument.load(pdfBytes);
    return pdf.getPageCount();
  }

  private async printSelectedPdf(): Promise<void> {
    try {
      const pdfBytes = await this.buildCurrentPdf();
      const url = this.pdfExportService.createPdfBlobUrl(pdfBytes);
      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      popup?.addEventListener(
        'load',
        () => {
          popup.print();
          window.setTimeout(() => URL.revokeObjectURL(url), 3000);
        },
        { once: true }
      );
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impression PDF impossible.');
    }
  }

  private getFileBaseName(): string {
    return this.fileName.replace(/\.pdf$/i, '');
  }
}

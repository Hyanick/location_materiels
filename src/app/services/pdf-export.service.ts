import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface PdfRenderResult {
  basePdfBytes: Uint8Array;
  pagePreviewUrls: string[];
}

@Injectable()
export class PdfExportService {
  async exportVisiblePrintPage(fileName = 'bon-location.pdf'): Promise<void> {
    const pdfBytes = await this.buildFinalPdf();
    this.downloadPdf(pdfBytes, fileName);
  }

  async buildFinalPdf(pageIndexes?: number[]): Promise<Uint8Array> {
    const renderResult = await this.buildRenderResult();
    return this.applyPagination(renderResult.basePdfBytes, pageIndexes);
  }

  async rebuildPdfFromBase(basePdfBytes: Uint8Array, pageIndexes?: number[]): Promise<Uint8Array> {
    return this.applyPagination(basePdfBytes, pageIndexes);
  }

  async buildRenderResult(): Promise<PdfRenderResult> {
    const printPage = this.findPrintPageSource();

    if (!printPage) {
      throw new Error('Aucun document à exporter en PDF.');
    }

    const renderTarget = this.createRenderTarget(printPage);
    const captureScale = Math.min(Math.max((window.devicePixelRatio || 1) * 1.5, 2.4), 3.2);

    try {
      const canvas = await html2canvas(renderTarget.page, {
        backgroundColor: '#ffffff',
        scale: captureScale,
        useCORS: true,
        logging: false,
        removeContainer: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.ceil(renderTarget.page.scrollWidth || renderTarget.page.offsetWidth || 794),
        windowHeight: Math.ceil(renderTarget.page.scrollHeight || renderTarget.page.offsetHeight || 1123)
      });

      const slices = this.sliceCanvasIntoPages(canvas);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      slices.forEach((slice, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const jpegData = slice.canvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(jpegData, 'JPEG', slice.marginMm, slice.marginMm, slice.printableWidthMm, slice.imageHeightMm, undefined, 'MEDIUM');
      });

      return {
        basePdfBytes: new Uint8Array(pdf.output('arraybuffer')),
        pagePreviewUrls: slices.map((slice) => slice.canvas.toDataURL('image/png'))
      };
    } finally {
      renderTarget.host.remove();
    }
  }

  downloadPdf(pdfBytes: Uint8Array, fileName = 'bon-location.pdf'): void {
    const blobUrl = this.createPdfBlobUrl(pdfBytes);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  createPdfBlobUrl(pdfBytes: Uint8Array): string {
    return URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
  }

  private async applyPagination(basePdfBytes: Uint8Array, pageIndexes?: number[]): Promise<Uint8Array> {
    const sourcePdf = await PDFDocument.load(basePdfBytes);
    const targetPdf = await PDFDocument.create();
    const helvetica = await targetPdf.embedFont(StandardFonts.Helvetica);
    const availableIndexes = sourcePdf.getPageIndices();
    const indexesToKeep = (pageIndexes?.length ? pageIndexes : availableIndexes).filter((index) => availableIndexes.includes(index));
    const copiedPages = await targetPdf.copyPages(sourcePdf, indexesToKeep);
    const totalPages = copiedPages.length;

    copiedPages.forEach((page, pageIndex) => {
      targetPdf.addPage(page);
      const { width } = page.getSize();
      const label = `Page ${pageIndex + 1}/${totalPages}`;
      const fontSize = 10;
      const textWidth = helvetica.widthOfTextAtSize(label, fontSize);

      page.drawRectangle({
        x: width - textWidth - 40,
        y: 10,
        width: textWidth + 12,
        height: 14,
        color: rgb(1, 1, 1)
      });

      page.drawText(label, {
        x: width - textWidth - 34,
        y: 14,
        size: fontSize,
        font: helvetica,
        color: rgb(0.39, 0.45, 0.55)
      });
    });

    return targetPdf.save();
  }

  private findPrintPageSource(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.print-page');
  }

  private createRenderTarget(source: HTMLElement): { host: HTMLDivElement; page: HTMLElement } {
    const host = document.createElement('div');
    const clone = source.cloneNode(true) as HTMLElement;

    host.setAttribute('data-pdf-render-host', 'true');
    host.style.position = 'fixed';
    host.style.left = '-100000px';
    host.style.top = '0';
    host.style.width = '210mm';
    host.style.padding = '0';
    host.style.margin = '0';
    host.style.background = '#ffffff';
    host.style.zIndex = '-1';
    host.style.pointerEvents = 'none';
    host.style.overflow = 'hidden';

    clone.style.display = 'flex';
    clone.style.visibility = 'visible';
    clone.style.position = 'relative';
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.transform = 'none';

    host.appendChild(clone);
    document.body.appendChild(host);

    return {
      host,
      page: clone
    };
  }

  private sliceCanvasIntoPages(canvas: HTMLCanvasElement): Array<{
    canvas: HTMLCanvasElement;
    marginMm: number;
    printableWidthMm: number;
    imageHeightMm: number;
  }> {
    const tempPdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidthMm = tempPdf.internal.pageSize.getWidth();
    const pageHeightMm = tempPdf.internal.pageSize.getHeight();
    const marginMm = 10;
    const footerHeightMm = 10;
    const printableWidthMm = pageWidthMm - marginMm * 2;
    const printableHeightMm = pageHeightMm - marginMm * 2 - footerHeightMm;
    const pixelsPerMm = canvas.width / printableWidthMm;
    const pageSliceHeightPx = Math.floor(printableHeightMm * pixelsPerMm);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageSliceHeightPx));
    const slices: Array<{
      canvas: HTMLCanvasElement;
      marginMm: number;
      printableWidthMm: number;
      imageHeightMm: number;
    }> = [];

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const sourceY = pageIndex * pageSliceHeightPx;
      const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - sourceY);
      const pageCanvas = document.createElement('canvas');
      const pageContext = pageCanvas.getContext('2d');

      if (!pageContext) {
        throw new Error('Impossible de préparer une page PDF.');
      }

      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      pageContext.imageSmoothingEnabled = true;
      pageContext.imageSmoothingQuality = 'high';
      pageContext.fillStyle = '#ffffff';
      pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageContext.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      slices.push({
        canvas: pageCanvas,
        marginMm,
        printableWidthMm,
        imageHeightMm: sliceHeightPx / pixelsPerMm
      });
    }

    return slices;
  }
}

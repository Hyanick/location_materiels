import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

interface WatermarkOptions {
  fontSize: number;
  opacity: number;
  angle: number;
  spacingX: number;
  spacingY: number;
  colors: string[];
}

@Injectable({ providedIn: 'root' })
export class FileProcessorService {
  private processedBlob?: Blob;

  async addWatermark(file: File, watermarkText: string, options?: WatermarkOptions): Promise<Blob> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
      this.processedBlob = await this.addWatermarkToPDF(file, watermarkText, options);
    } else if (fileType.startsWith('image/')) {
      this.processedBlob = await this.addWatermarkToImage(file, watermarkText, options);
    } else {
      throw new Error('Format non supporté');
    }

    return this.processedBlob;
  }

  downloadProcessedFile() {
    if (this.processedBlob) {
      const url = URL.createObjectURL(this.processedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document_filigrane.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert('Aucun fichier à télécharger.');
    }
  }

  private async addWatermarkToPDF(file: File, text: string, options?: WatermarkOptions): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Paramètres du filigrane (tu peux les rendre dynamiques plus tard)
    const fontSize = options?.fontSize ?? 12;
    const opacity = options?.opacity ?? 0.3;
    const angle = options?.angle ?? 30;
    const spacingX = options?.spacingX ?? 180;
    const spacingY = options?.spacingY ?? 180;

    // Couleurs alternées (rouge, gris, bleu)
    const colors = [
      this.hexToRgb(options?.colors?.[0] ?? '#b42318'),
      this.hexToRgb(options?.colors?.[1] ?? '#667085'),
      this.hexToRgb(options?.colors?.[2] ?? '#1f4b7a')
    ];

    for (const page of pages) {
      const { width, height } = page.getSize();

      let colorIndex = 0;
      for (let y = -height; y < height * 2; y += spacingY) {
        const color = colors[colorIndex % colors.length];
        colorIndex++;

        const offsetX = (colorIndex % 2 === 0) ? spacingX / 2 : 0;

        for (let x = -width; x < width * 2; x += spacingX) {
          page.drawText(text, {
            x: x + offsetX,
            y,
            size: fontSize,
            font,
            color,
            rotate: degrees(angle),
            opacity,
          });
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  private async addWatermarkToImage(file: File, text: string, options?: WatermarkOptions): Promise<Blob> {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);
    ctx.font = `${options?.fontSize ?? 24}px Arial`;
    ctx.fillStyle = this.hexToRgba(options?.colors?.[0] ?? '#667085', options?.opacity ?? 0.3);
    ctx.rotate(((options?.angle ?? -30) * Math.PI) / 180);
    ctx.fillText(text, img.width / 4, img.height / 2);

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  }

  private hexToRgb(hex: string) {
    const normalized = hex.replace('#', '');
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const normalized = hex.replace('#', '');
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

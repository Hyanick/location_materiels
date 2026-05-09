import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

@Injectable({ providedIn: 'root' })
export class FileProcessorService {
  private processedBlob?: Blob;

  async addWatermark(file: File, watermarkText: string): Promise<Blob> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
      this.processedBlob = await this.addWatermarkToPDF(file, watermarkText);
    } else if (fileType.startsWith('image/')) {
      this.processedBlob = await this.addWatermarkToImage(file, watermarkText);
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

  private async addWatermarkToPDF(file: File, text: string): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Paramètres du filigrane (tu peux les rendre dynamiques plus tard)
    const fontSize = 12;
    const opacity = 0.3;
    const angle = 30;
    const spacingX = 180;
    const spacingY = 180;

    // Couleurs alternées (rouge, gris, bleu)
    const colors = [
      rgb(1, 0, 0),      // rouge
      rgb(0.4, 0.4, 0.4), // gris
      rgb(0.2, 0.4, 1)   // bleu
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

  private async addWatermarkToImage(file: File, text: string): Promise<Blob> {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(text, img.width / 4, img.height / 2);

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  }
}

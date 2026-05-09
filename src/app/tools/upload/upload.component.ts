import { Component, ElementRef, ViewChild } from '@angular/core';
import { FileProcessorService } from '../../services/file-processor.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class UploadComponent {
  selectedFile?: File;
  watermarkText = '';
  previewUrl?: string;
  safePreviewUrl?: SafeResourceUrl;
  isProcessing = false;
  showPreview = false;

  // Options de personnalisation
  fontSize = 28;
  opacity = 0.25;
  angle = -30;
  spacingX = 300;
  spacingY = 200;
  colors = ['#ff0000', '#000000', '#6666ff']; // rouge, noir, bleu
  selectedColor = '#1f4b7a';

  @ViewChild('imageCanvas', { static: false }) imageCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(
    private fileProcessor: FileProcessorService,
    private sanitizer: DomSanitizer
  ) { }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
    this.showPreview = false;
  }

  previewWatermark() {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner un fichier avant de prévisualiser.');
      return;
    }

    this.showPreview = true;

    if (this.selectedFile.type.startsWith('image/')) {
      setTimeout(() => this.drawPreviewWatermark(), 300);
    }
  }

  drawPreviewWatermark() {
    if (!this.imageCanvas || !this.previewUrl) return;

    const canvas = this.imageCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = this.previewUrl;

    img.onload = () => {
      // Ajuste la taille du canvas à celle de l’image
      canvas.width = img.width;
      canvas.height = img.height;

      // Efface tout avant de redessiner
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dessine l’image originale
      ctx.drawImage(img, 0, 0);

      // Sauvegarde l’état initial
      ctx.save();

      // Applique la rotation
      const angleRad = (this.angle * Math.PI) / 180;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angleRad);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Paramètres du texte
      const text = this.watermarkText;
      const fontSize = this.fontSize || 24;
      const spacingX = this.spacingX || 280;
      const spacingY = this.spacingY || 180;
      const opacity = this.opacity || 0.3;

      // Palette de couleurs alternées
      const colors = [
        this.hexToRgba(this.selectedColor, opacity),
        this.hexToRgba('#667085', opacity),
        this.hexToRgba('#b42318', opacity)
      ];

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${fontSize}px Arial`;

      // Dessine le texte en diagonale avec alternance de couleurs et décalage
      let colorIndex = 0;
      for (let y = -canvas.height; y < canvas.height * 2; y += spacingY) {
        const color = colors[colorIndex % colors.length];
        ctx.fillStyle = color;
        colorIndex++;

        // Décalage horizontal pour effet "vague"
        const offsetX = (colorIndex % 2 === 0) ? spacingX / 2 : 0;

        for (let x = -canvas.width; x < canvas.width * 2; x += spacingX) {
          ctx.fillText(text, x + offsetX, y);
        }
      }

      // Restaure l’état initial
      ctx.restore();
    };
  }



  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  onConfigChange() {
    if (this.selectedFile?.type.startsWith('image/') && this.showPreview) {
      this.drawPreviewWatermark();
    }
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.onConfigChange();
  }

  async applyWatermark() {
    if (!this.selectedFile || !this.watermarkText.trim()) {
      alert('Veuillez sélectionner un fichier et saisir un texte de filigrane.');
      return;
    }

    this.isProcessing = true;
    const blob = await this.fileProcessor.addWatermark(this.selectedFile, this.watermarkText, {
      fontSize: this.fontSize,
      opacity: this.opacity,
      angle: this.angle,
      spacingX: this.spacingX,
      spacingY: this.spacingY,
      colors: [this.selectedColor, '#667085', '#b42318']
    });
    this.previewUrl = URL.createObjectURL(blob);
    this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
    this.isProcessing = false;
    this.showPreview = true;
  }

  downloadFile() {
    this.fileProcessor.downloadProcessedFile();
  }
}

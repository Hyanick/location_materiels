import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FileProcessorService } from '../../services/file-processor.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AppSettingsService } from '../../services/app-settings.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class UploadComponent implements OnInit {
  private readonly settings = inject(AppSettingsService);
  private readonly toast = inject(ToastService);

  selectedFile?: File;
  watermarkText = '';
  outputFileName = 'document-filigrane.pdf';
  previewUrl?: string;
  safePreviewUrl?: SafeResourceUrl;
  isProcessing = false;
  showPreview = false;
  isPreviewFullscreen = false;

  // Options de personnalisation
  fontSize = 28;
  opacity = 0.25;
  angle = -30;
  spacingX = 300;
  spacingY = 200;
  colors = ['#1f4b7a', '#b42318', '#667085'];
  selectedColor = '#1f4b7a';
  repeatedWatermark = true;
  readonly presets = ['Confidentiel', 'Payé', 'Brouillon', 'Bon pour accord'];
  readonly angles = [
    { label: 'Diagonale', value: -30 },
    { label: 'Horizontal', value: 0 },
    { label: 'Vertical', value: -90 }
  ];

  @ViewChild('imageCanvas', { static: false }) imageCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(
    private fileProcessor: FileProcessorService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.watermarkText = this.settings.settings().defaultWatermarkText;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.setSelectedFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.setSelectedFile(event.dataTransfer?.files?.[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setSelectedFile(file?: File): void {
    if (!file) return;

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
    this.showPreview = false;
    this.outputFileName = this.buildDefaultOutputFileName(file.name);
    this.toast.success('Fichier chargé.');
  }

  async previewWatermark(): Promise<void> {
    if (!this.selectedFile) {
      this.toast.error('Sélectionne un fichier avant de prévisualiser.');
      return;
    }

    if (!this.watermarkText.trim()) {
      this.toast.error('Saisis un texte de filigrane.');
      return;
    }

    if (this.selectedFile.type === 'application/pdf') {
      await this.applyWatermark();
      return;
    }

    this.showPreview = true;
    setTimeout(() => this.drawPreviewWatermark(), 300);
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

      if (!this.repeatedWatermark) {
        ctx.fillStyle = colors[0];
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      } else {
        let colorIndex = 0;
        for (let y = -canvas.height; y < canvas.height * 2; y += spacingY) {
          const color = colors[colorIndex % colors.length];
          ctx.fillStyle = color;
          colorIndex++;

          const offsetX = (colorIndex % 2 === 0) ? spacingX / 2 : 0;

          for (let x = -canvas.width; x < canvas.width * 2; x += spacingX) {
            ctx.fillText(text, x + offsetX, y);
          }
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

  applyPreset(text: string): void {
    this.watermarkText = text;
    this.onConfigChange();
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.onConfigChange();
  }

  async applyWatermark() {
    if (!this.selectedFile || !this.watermarkText.trim()) {
      this.toast.error('Sélectionne un fichier et saisis un texte de filigrane.');
      return;
    }

    try {
      this.isProcessing = true;
      const blob = await this.fileProcessor.addWatermark(this.selectedFile, this.watermarkText, this.buildWatermarkOptions());
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.previewUrl = URL.createObjectURL(blob);
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
      this.showPreview = true;
      this.toast.success('Filigrane appliqué.');
    } catch {
      this.toast.error('Impossible d’appliquer le filigrane.');
    } finally {
      this.isProcessing = false;
    }
  }

  downloadFile() {
    this.fileProcessor.downloadProcessedFile(this.ensurePdfExtension(this.outputFileName));
    this.toast.success('Téléchargement lancé.');
  }

  openPreviewFullscreen(): void {
    if (this.showPreview && this.previewUrl) {
      this.isPreviewFullscreen = true;
    }
  }

  closePreviewFullscreen(): void {
    this.isPreviewFullscreen = false;
  }

  private buildWatermarkOptions() {
    return {
      fontSize: this.fontSize,
      opacity: this.opacity,
      angle: this.angle,
      spacingX: this.spacingX,
      spacingY: this.spacingY,
      colors: [this.selectedColor, '#667085', '#b42318'],
      repeated: this.repeatedWatermark
    };
  }

  private buildDefaultOutputFileName(fileName: string): string {
    const baseName = fileName.replace(/\.[^.]+$/, '').replace(/\s+/g, '-');
    return `${baseName || 'document'}-filigrane.pdf`;
  }

  private ensurePdfExtension(fileName: string): string {
    const trimmed = fileName.trim() || 'document-filigrane.pdf';
    return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
  }
}

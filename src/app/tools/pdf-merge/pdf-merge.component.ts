import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { AppSettingsService } from '../../services/app-settings.service';
import { ToastService } from '../../services/toast.service';


interface PdfFile {
  file: File;
  previewUrl: string;
  pageCount: number;
}

@Component({
  selector: 'app-pdf-merge',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './pdf-merge.component.html',
  styleUrls: ['./pdf-merge.component.scss']
})
export class PdfMergeComponent implements OnInit {
  private readonly settings = inject(AppSettingsService);
  private readonly toast = inject(ToastService);

  files = signal<PdfFile[]>([]);
  progress = signal<number>(0);
  merging = signal<boolean>(false);
  mergedPreviewUrl = signal<string | null>(null);
  outputFileName = signal<string>('fusion-pdf.pdf'); // nom par défaut
  selectedPreviewIndex = signal<number>(0);
  insertBlankPage = signal(false);
  finalPageCount = signal(0);
  finalSizeLabel = signal('');
  draggedIndex = signal<number | null>(null);
  isPreviewFullscreen = signal(false);

  ngOnInit(): void {
    const settings = this.settings.settings();
    this.outputFileName.set(settings.defaultMergedPdfName);
    this.insertBlankPage.set(settings.insertBlankPageBetweenMergedPdfs);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      await this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    await this.addFiles(Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type === 'application/pdf'));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  async addFiles(files: File[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const nextFiles = await Promise.all(files.map((file) => this.createPdfFile(file)));
    this.files.update((currentFiles) => [...currentFiles, ...nextFiles]);
    this.selectedPreviewIndex.set(this.files().length - nextFiles.length);
    this.resetMergedResult();
    this.toast.success(`${nextFiles.length} PDF ajouté${nextFiles.length > 1 ? 's' : ''}.`);
  }

  removeFile(index: number) {
    const currentFiles = [...this.files()];
    URL.revokeObjectURL(currentFiles[index].previewUrl);
    currentFiles.splice(index, 1);
    this.files.set(currentFiles);
    this.selectedPreviewIndex.set(Math.max(0, Math.min(this.selectedPreviewIndex(), currentFiles.length - 1)));
    this.resetMergedResult();
  }

  clearAll() {
    this.files().forEach(f => URL.revokeObjectURL(f.previewUrl));
    this.files.set([]);
    this.selectedPreviewIndex.set(0);
    this.resetMergedResult();
  }

  moveFile(index: number, direction: 'up' | 'down') {
    const currentFiles = [...this.files()];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= currentFiles.length) return;

    const temp = currentFiles[index];
    currentFiles[index] = currentFiles[newIndex];
    currentFiles[newIndex] = temp;

    this.files.set(currentFiles);
    this.selectedPreviewIndex.set(newIndex);
    this.resetMergedResult();
  }

  handleDragStart(index: number): void {
    this.draggedIndex.set(index);
  }

  handleDrop(index: number): void {
    const fromIndex = this.draggedIndex();
    this.draggedIndex.set(null);

    if (fromIndex === null || fromIndex === index) {
      return;
    }

    const currentFiles = [...this.files()];
    const [movedFile] = currentFiles.splice(fromIndex, 1);
    currentFiles.splice(index, 0, movedFile);
    this.files.set(currentFiles);
    this.selectedPreviewIndex.set(index);
    this.resetMergedResult();
  }

  selectPreview(index: number): void {
    this.selectedPreviewIndex.set(index);
  }

  selectedPreviewUrl(): string | null {
    return this.files()[this.selectedPreviewIndex()]?.previewUrl ?? null;
  }

  async mergePdfs() {
    if (this.files().length === 0) return;

    try {
      this.merging.set(true);
      this.progress.set(0);

      const mergedPdf = await PDFDocument.create();
      const totalFiles = this.files().length;

      for (let i = 0; i < totalFiles; i++) {
        const file = this.files()[i].file;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));

        if (this.insertBlankPage() && i < totalFiles - 1) {
          mergedPdf.addPage();
        }

        this.progress.set(Math.round(((i + 1) / totalFiles) * 100));
      }

      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      this.resetMergedResult();
      this.mergedPreviewUrl.set(url);
      this.finalPageCount.set(mergedPdf.getPageCount());
      this.finalSizeLabel.set(this.formatSize(blob.size));
      this.toast.success('Fusion terminée.');
    } catch {
      this.toast.error('Impossible de fusionner les PDF.');
    } finally {
      this.merging.set(false);
    }
  }

  downloadMerged() {
    const url = this.mergedPreviewUrl();
    if (!url) return;

    let fileName = this.outputFileName().trim();
    if (!fileName) fileName = 'fusion-pdf.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    this.toast.success('Téléchargement lancé.');
  }

  openPreviewFullscreen(): void {
    if (this.mergedPreviewUrl() || this.selectedPreviewUrl()) {
      this.isPreviewFullscreen.set(true);
    }
  }

  closePreviewFullscreen(): void {
    this.isPreviewFullscreen.set(false);
  }

  onFileNameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.outputFileName.set(input.value);
  }

  ngOnDestroy() {
    this.files().forEach(f => URL.revokeObjectURL(f.previewUrl));
    if (this.mergedPreviewUrl()) URL.revokeObjectURL(this.mergedPreviewUrl()!);
  }

  totalPageCount(): number {
    return this.files().reduce((total, item) => total + item.pageCount, 0) + (this.insertBlankPage() ? Math.max(0, this.files().length - 1) : 0);
  }

  private async createPdfFile(file: File): Promise<PdfFile> {
    let pageCount = 0;

    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      pageCount = pdf.getPageCount();
    } catch {
      this.toast.error(`Lecture impossible : ${file.name}`);
    }

    return {
      file,
      previewUrl: URL.createObjectURL(file),
      pageCount
    };
  }

  private resetMergedResult(): void {
    const url = this.mergedPreviewUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }

    this.mergedPreviewUrl.set(null);
    this.finalPageCount.set(0);
    this.finalSizeLabel.set('');
  }

  private formatSize(size: number): string {
    return `${(size / 1024 / 1024).toFixed(1)} Mo`;
  }
}

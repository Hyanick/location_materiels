import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';


interface PdfFile {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-pdf-merge',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './pdf-merge.component.html',
  styleUrls: ['./pdf-merge.component.scss']
})
export class PdfMergeComponent {
  files = signal<PdfFile[]>([]);
  progress = signal<number>(0);
  merging = signal<boolean>(false);
  mergedPreviewUrl = signal<string | null>(null);
  outputFileName = signal<string>('fusion-pdf.pdf'); // nom par défaut
  selectedPreviewIndex = signal<number>(0);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const selectedFiles = Array.from(input.files).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      // Nettoyer les anciens URLs
      this.files().forEach(f => URL.revokeObjectURL(f.previewUrl));

      this.files.set(selectedFiles);
      this.selectedPreviewIndex.set(0);
      this.mergedPreviewUrl.set(null);
    }
  }

  removeFile(index: number) {
    const currentFiles = [...this.files()];
    URL.revokeObjectURL(currentFiles[index].previewUrl);
    currentFiles.splice(index, 1);
    this.files.set(currentFiles);
    this.selectedPreviewIndex.set(Math.max(0, Math.min(this.selectedPreviewIndex(), currentFiles.length - 1)));
  }

  clearAll() {
    this.files().forEach(f => URL.revokeObjectURL(f.previewUrl));
    this.files.set([]);
    this.selectedPreviewIndex.set(0);
    this.mergedPreviewUrl.set(null);
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
  }

  selectPreview(index: number): void {
    this.selectedPreviewIndex.set(index);
  }

  selectedPreviewUrl(): string | null {
    return this.files()[this.selectedPreviewIndex()]?.previewUrl ?? null;
  }

  async mergePdfs() {
    if (this.files().length === 0) return;

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

      this.progress.set(Math.round(((i + 1) / totalFiles) * 100));
    }

    const mergedPdfFile = await mergedPdf.save();
    const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    this.mergedPreviewUrl.set(url);
    this.merging.set(false);
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
  }

  onFileNameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.outputFileName.set(input.value);
  }

  ngOnDestroy() {
    this.files().forEach(f => URL.revokeObjectURL(f.previewUrl));
    if (this.mergedPreviewUrl()) URL.revokeObjectURL(this.mergedPreviewUrl()!);
  }
}

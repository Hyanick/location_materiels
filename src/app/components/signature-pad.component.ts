import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signature-pad">
      <canvas
        #signatureCanvas
        class="signature-canvas"
        (pointerdown)="startStroke($event)"
        (pointermove)="drawStroke($event)"
        (pointerup)="endStroke($event)"
        (pointerleave)="endStroke($event)"
        (pointercancel)="endStroke($event)"
      ></canvas>
    </div>
  `
})
export class SignaturePadComponent implements AfterViewInit, OnChanges {
  @Input() value = '';
  @Input() disabled = false;
  @Input() placeholderText = 'Signez ici avec le doigt ou le stylet';
  @Input() strokeColor = '#142136';
  @Input() lineWidth = 2;
  @Input() backgroundColor = '#ffffff';
  @Input() empty = false;

  @ViewChild('signatureCanvas', { static: true })
  private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private context: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  private hasDrawn = false;

  @Input({ required: true }) onChange!: (dataUrl: string) => void;

  ngAfterViewInit(): void {
    this.setupCanvas();
    this.renderCurrentValue();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['value'] ||
      changes['empty'] ||
      changes['strokeColor'] ||
      changes['backgroundColor']
    ) {
      queueMicrotask(() => {
        if (!this.canvasRef) {
          return;
        }

        this.setupCanvas();
        this.renderCurrentValue();
      });
    }
  }

  @HostListener('window:resize')
  handleResize(): void {
    this.setupCanvas();
    this.renderCurrentValue();
  }

  startStroke(event: PointerEvent): void {
    if (this.disabled) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    canvas.setPointerCapture(event.pointerId);
    const hadExistingDrawing = this.hasDrawn;
    this.isDrawing = true;
    this.hasDrawn = true;

    if (!hadExistingDrawing) {
      this.paintBackground();
    }

    const point = this.getCanvasPoint(event);
    this.context?.beginPath();
    this.context?.moveTo(point.x, point.y);
    this.context?.lineTo(point.x, point.y);
    this.context?.stroke();
    event.preventDefault();
  }

  drawStroke(event: PointerEvent): void {
    if (!this.isDrawing || this.disabled) {
      return;
    }

    const point = this.getCanvasPoint(event);
    this.context?.lineTo(point.x, point.y);
    this.context?.stroke();
    event.preventDefault();
  }

  endStroke(event: PointerEvent): void {
    if (!this.isDrawing || this.disabled) {
      return;
    }

    this.isDrawing = false;
    this.context?.closePath();
    this.emitSignature();
    event.preventDefault();
  }

  clear(): void {
    this.hasDrawn = false;
    this.paintBackground();
    this.onChange('');
    this.drawPlaceholder();
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(Math.floor(bounds.width), 280);
    const height = Math.max(Math.floor(bounds.height), 180);

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    this.context = canvas.getContext('2d');

    if (!this.context) {
      return;
    }

    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    this.context.strokeStyle = this.strokeColor;
    this.context.lineWidth = this.lineWidth;

    this.paintBackground();
  }

  private renderCurrentValue(): void {
    if (this.empty) {
      this.clear();
      return;
    }

    if (!this.value) {
      this.hasDrawn = false;
      this.paintBackground();
      this.drawPlaceholder();
      return;
    }

    const image = new Image();
    image.onload = () => {
      this.paintBackground();
      const { width, height } = this.getCanvasDisplaySize();
      this.context?.drawImage(image, 0, 0, width, height);
      this.hasDrawn = true;
    };
    image.src = this.value;
  }

  private paintBackground(): void {
    if (!this.context) {
      return;
    }

    const { width, height } = this.getCanvasDisplaySize();
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, width, height);
  }

  private drawPlaceholder(): void {
    if (!this.context || this.hasDrawn) {
      return;
    }

    const { width, height } = this.getCanvasDisplaySize();

    this.context.save();
    this.context.fillStyle = '#7b8798';
    this.context.font = '16px "Segoe UI", Arial, sans-serif';
    this.context.textAlign = 'center';
    this.context.fillText(this.placeholderText, width / 2, height / 2);
    this.context.restore();
  }

  private emitSignature(): void {
    if (!this.context) {
      return;
    }

    this.onChange(this.canvasRef.nativeElement.toDataURL('image/png'));
  }

  private getCanvasPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private getCanvasDisplaySize(): { width: number; height: number } {
    const canvas = this.canvasRef.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    return {
      width: canvas.width / ratio,
      height: canvas.height / ratio
    };
  }
}

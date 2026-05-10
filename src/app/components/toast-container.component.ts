import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-region no-print" aria-live="polite" aria-label="Notifications">
      @for (message of toast.messages(); track message.id) {
        <button type="button" class="toast-message" [class]="message.tone" (click)="toast.dismiss(message.id)">
          {{ message.text }}
        </button>
      }
    </div>
  `
})
export class ToastContainerComponent {
  protected readonly toast = inject(ToastService);
}

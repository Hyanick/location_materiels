import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
}

@Injectable()
export class ToastService {
  private nextId = 1;
  readonly messages = signal<ToastMessage[]>([]);

  success(text: string): void {
    this.show(text, 'success');
  }

  info(text: string): void {
    this.show(text, 'info');
  }

  error(text: string): void {
    this.show(text, 'error');
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(text: string, tone: ToastTone): void {
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, text, tone }]);
    window.setTimeout(() => this.dismiss(id), 3600);
  }
}

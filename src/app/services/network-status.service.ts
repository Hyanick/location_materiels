import { Injectable, signal } from '@angular/core';

@Injectable()
export class NetworkStatusService {
  readonly isOnline = signal(this.readOnlineStatus());

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private readonly handleOnline = (): void => {
    this.isOnline.set(true);
  };

  private readonly handleOffline = (): void => {
    this.isOnline.set(false);
  };

  private readOnlineStatus(): boolean {
    if (typeof navigator === 'undefined') {
      return true;
    }

    return navigator.onLine;
  }
}

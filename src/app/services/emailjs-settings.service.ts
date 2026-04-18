import { Injectable } from '@angular/core';
import { EmailJsSettings } from '../models/emailjs-settings.model';

@Injectable()
export class EmailJsSettingsService {
  private readonly storageKey = 'rental-document-app/emailjs-settings';

  read(): EmailJsSettings {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return this.getEmptySettings();
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<EmailJsSettings>;
      return {
        publicKey: parsed.publicKey ?? '',
        serviceId: parsed.serviceId ?? '',
        templateId: parsed.templateId ?? ''
      };
    } catch {
      return this.getEmptySettings();
    }
  }

  save(settings: EmailJsSettings): void {
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
  }

  isConfigured(settings: EmailJsSettings): boolean {
    return Boolean(settings.publicKey.trim() && settings.serviceId.trim() && settings.templateId.trim());
  }

  private getEmptySettings(): EmailJsSettings {
    return {
      publicKey: '',
      serviceId: '',
      templateId: ''
    };
  }
}

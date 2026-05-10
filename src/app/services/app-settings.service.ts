import { Injectable, signal } from '@angular/core';

export interface AppSettings {
  defaultWatermarkText: string;
  defaultMergedPdfName: string;
  insertBlankPageBetweenMergedPdfs: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultWatermarkText: 'Confidentiel',
  defaultMergedPdfName: 'fusion-pdf.pdf',
  insertBlankPageBetweenMergedPdfs: false
};

@Injectable()
export class AppSettingsService {
  private readonly storageKey = 'tools-app/settings';
  readonly settings = signal<AppSettings>(this.read());

  update<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings.update((settings) => {
      const next = { ...settings, [key]: value };
      localStorage.setItem(this.storageKey, JSON.stringify(next));
      return next;
    });
  }

  private read(): AppSettings {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return DEFAULT_SETTINGS;
    }

    try {
      return {
        ...DEFAULT_SETTINGS,
        ...(JSON.parse(rawValue) as Partial<AppSettings>)
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
}

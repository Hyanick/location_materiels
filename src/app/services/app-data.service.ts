import { Injectable } from '@angular/core';

@Injectable()
export class AppDataService {
  private readonly keys = [
    'rental-document-app/current-document',
    'rental-document-app/history',
    'rental-document-app/recent-customers',
    'tools-app/customers',
    'tools-app/catalog',
    'tools-app/settings'
  ];

  exportData(): void {
    const data = Object.fromEntries(this.keys.map((key) => [key, localStorage.getItem(key)]));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tools-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importData(file: File): Promise<void> {
    const data = JSON.parse(await file.text()) as Record<string, string | null>;
    this.keys.forEach((key) => {
      const value = data[key];
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      }
    });
  }

  resetAll(): void {
    this.keys.forEach((key) => localStorage.removeItem(key));
  }
}

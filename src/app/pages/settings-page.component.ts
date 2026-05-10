import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppSettings } from '../services/app-settings.service';
import { AppDataService } from '../services/app-data.service';
import { AppSettingsService } from '../services/app-settings.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="settings-page">
      <section class="settings-hero">
        <p class="tools-kicker">Paramètres</p>
        <h1>Préférences des outils</h1>
        <p>Valeurs par défaut utilisées par Filigramme et Merge.</p>
      </section>

      <section class="settings-card">
        <label>
          <span>Filigrane par défaut</span>
          <input [ngModel]="settings.settings().defaultWatermarkText" (ngModelChange)="updateSetting('defaultWatermarkText', $event)" />
        </label>

        <label>
          <span>Nom par défaut du PDF fusionné</span>
          <input [ngModel]="settings.settings().defaultMergedPdfName" (ngModelChange)="updateSetting('defaultMergedPdfName', $event)" />
        </label>

        <label class="toggle-field">
          <input
            type="checkbox"
            [ngModel]="settings.settings().insertBlankPageBetweenMergedPdfs"
            (ngModelChange)="updateSetting('insertBlankPageBetweenMergedPdfs', $event)"
          />
          <span>Insérer une page blanche entre les PDF fusionnés</span>
        </label>
      </section>

      <section class="settings-card">
        <h2>Données locales</h2>
        <div class="settings-actions">
          <button type="button" class="secondary-btn" (click)="exportData()">Exporter les données</button>
          <button type="button" class="secondary-btn" (click)="importInput.click()">Importer une sauvegarde</button>
          <button type="button" class="danger-btn" (click)="resetAll()">Réinitialiser les données</button>
          <input #importInput type="file" accept="application/json" hidden (change)="importData($event)" />
        </div>
      </section>
    </main>
  `,
  styles: [`
    .settings-page {
      min-height: calc(100vh - 61px);
      padding: 32px;
    }

    .settings-hero,
    .settings-card {
      width: min(820px, 100%);
      margin: 0 auto;
    }

    .settings-hero {
      margin-bottom: 18px;
    }

    .tools-kicker {
      margin: 0 0 6px;
      color: var(--primary);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--primary-strong);
      font-size: 34px;
    }

    .settings-hero p:last-child {
      margin: 8px 0 0;
      color: var(--muted);
    }

    .settings-card {
      margin-bottom: 18px;
      display: grid;
      gap: 18px;
      padding: 24px;
      border: 1px solid rgba(31, 75, 122, 0.14);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 16px 36px rgba(21, 39, 72, 0.08);
    }

    .settings-card h2 {
      margin: 0;
      color: var(--primary-strong);
    }

    .settings-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    @media (max-width: 720px) {
      .settings-page {
        padding: 18px 12px 28px;
      }

      h1 {
        font-size: 28px;
      }

      .settings-card {
        padding: 18px;
      }

      .settings-actions {
        display: grid;
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .settings-page {
        padding: 12px 10px 24px;
      }

      h1 {
        font-size: 24px;
      }

      .settings-card {
        padding: 14px;
      }
    }
  `]
})
export class SettingsPageComponent {
  protected readonly settings = inject(AppSettingsService);
  private readonly dataService = inject(AppDataService);
  private readonly toast = inject(ToastService);

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings.update(key, value);
    this.toast.success('Paramètre enregistré.');
  }

  exportData(): void {
    this.dataService.exportData();
    this.toast.success('Sauvegarde exportée.');
  }

  async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    await this.dataService.importData(file);
    this.toast.success('Sauvegarde importée. Recharge la page pour tout relire.');
    input.value = '';
  }

  resetAll(): void {
    this.dataService.resetAll();
    this.toast.success('Données locales réinitialisées. Recharge la page pour repartir à zéro.');
  }
}

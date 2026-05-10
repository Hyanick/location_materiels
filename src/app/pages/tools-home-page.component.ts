import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerBookService } from '../services/customer-book.service';
import { LocalCatalogService } from '../services/local-catalog.service';
import { RentalStorageService } from '../services/rental-storage.service';

interface ToolCard {
  title: string;
  description: string;
  route: string;
  tone: string;
  meta: string;
}

@Component({
  selector: 'app-tools-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="tools-home">
      <section class="tools-hero">
        <div>
          <p class="tools-kicker">Boite a outils</p>
          <h1>Choisis ton outil</h1>
          <p class="tools-intro">Accede rapidement au filigrane, a la fusion PDF ou au bon de location.</p>
        </div>
      </section>

      <section class="dashboard-strip" aria-label="Résumé">
        <a routerLink="/location/historique"><strong>{{ historyCount() }}</strong><span>Bons</span></a>
        <a routerLink="/location/clients"><strong>{{ customerCount() }}</strong><span>Clients</span></a>
        <a routerLink="/location/catalogue"><strong>{{ availableCatalogCount() }}</strong><span>Articles disponibles</span></a>
      </section>

      <section class="tools-grid" aria-label="Outils disponibles">
        @for (tool of tools; track tool.route) {
          <a class="tool-card" [class]="tool.tone" [routerLink]="tool.route">
            <span class="tool-icon" aria-hidden="true"></span>
            <span class="tool-title">{{ tool.title }}</span>
            <span class="tool-description">{{ tool.description }}</span>
            <span class="tool-footer">
              <span>{{ tool.meta }}</span>
              <span class="tool-action">Ouvrir</span>
            </span>
          </a>
        }
      </section>

      <section class="quick-panel">
        <div>
          <h2>Raccourcis rapides</h2>
          <p>Commence un bon, gère ton catalogue ou retrouve un document existant.</p>
        </div>
        <div class="quick-actions">
          <a routerLink="/location" class="primary-btn">Nouveau bon</a>
          <a routerLink="/location/clients" class="secondary-btn">Clients</a>
          <a routerLink="/location/historique" class="secondary-btn">Historique</a>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .tools-home {
      min-height: 100vh;
      padding: 38px 32px;
      color: var(--text);
    }

    .tools-hero {
      max-width: 980px;
      margin: 0 auto 26px;
    }

    .tools-kicker {
      margin: 0 0 8px;
      color: var(--primary);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .tools-hero h1 {
      margin: 0;
      font-size: 44px;
      line-height: 1.08;
      color: var(--primary-strong);
    }

    .tools-intro {
      margin: 12px 0 0;
      max-width: 620px;
      color: var(--muted);
      font-size: 17px;
      line-height: 1.55;
    }

    .tools-grid {
      max-width: 980px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .dashboard-strip,
    .quick-panel {
      max-width: 980px;
      margin: 0 auto 18px;
    }

    .dashboard-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .dashboard-strip a {
      border: 1px solid rgba(31, 75, 122, 0.14);
      border-radius: 8px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.92);
      color: inherit;
      text-decoration: none;
      box-shadow: 0 12px 28px rgba(21, 39, 72, 0.06);
    }

    .dashboard-strip strong,
    .dashboard-strip span {
      display: block;
    }

    .dashboard-strip strong {
      color: var(--primary-strong);
      font-size: 28px;
    }

    .dashboard-strip span {
      color: var(--muted);
      font-weight: 700;
    }

    .quick-panel {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: center;
      padding: 20px;
      border: 1px solid rgba(31, 75, 122, 0.14);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.92);
    }

    .quick-panel h2 {
      margin: 0;
      color: var(--primary-strong);
    }

    .quick-panel p {
      margin: 6px 0 0;
      color: var(--muted);
    }

    .quick-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .tool-card {
      min-height: 230px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 24px;
      border: 1px solid rgba(31, 75, 122, 0.14);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.92);
      color: inherit;
      text-decoration: none;
      box-shadow: 0 16px 36px rgba(21, 39, 72, 0.08);
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .tool-card:hover {
      transform: translateY(-2px);
      border-color: rgba(31, 75, 122, 0.35);
      box-shadow: 0 20px 42px rgba(21, 39, 72, 0.13);
    }

    .tool-icon {
      width: 48px;
      height: 48px;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: var(--primary-soft);
      color: var(--primary);
    }

    .tool-icon::before,
    .tool-icon::after {
      content: "";
      position: absolute;
      display: block;
    }

    .tool-icon::before {
      width: 22px;
      height: 28px;
      border: 2px solid currentColor;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.44);
    }

    .tool-icon::after {
      width: 14px;
      height: 2px;
      background: currentColor;
      box-shadow: 0 6px 0 currentColor, 0 12px 0 currentColor;
    }

    .merge .tool-icon::before {
      transform: translate(-4px, -3px);
      box-shadow: 8px 6px 0 rgba(31, 75, 122, 0.14);
    }

    .filigramme .tool-icon::after {
      width: 24px;
      transform: rotate(-24deg);
      box-shadow: 0 7px 0 currentColor;
    }

    .location .tool-icon::after {
      width: 16px;
      height: 16px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      background: transparent;
      box-shadow: none;
      transform: rotate(45deg);
    }

    .tool-title {
      margin-top: 6px;
      color: var(--primary-strong);
      font-size: 23px;
      font-weight: 800;
    }

    .tool-description {
      color: var(--muted);
      line-height: 1.5;
      flex: 1;
    }

    .tool-footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(31, 75, 122, 0.10);
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }

    .tool-action {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 10px;
      background: var(--primary);
      color: white;
      font-weight: 800;
    }

    @media (max-width: 820px) {
      .tools-home {
        padding: 24px 14px 32px;
      }

      .tools-grid {
        grid-template-columns: 1fr;
      }

      .dashboard-strip {
        grid-template-columns: 1fr;
      }

      .quick-panel {
        align-items: stretch;
        flex-direction: column;
      }

      .quick-actions {
        display: grid;
        grid-template-columns: 1fr;
      }

      .tool-card {
        min-height: 0;
      }

      .tools-hero h1 {
        font-size: 32px;
      }
    }

    @media (max-width: 560px) {
      .tools-home {
        min-height: calc(100dvh - 59px);
        padding: 14px 10px 20px;
      }

      .tools-hero {
        margin-bottom: 12px;
      }

      .tools-hero h1 {
        font-size: 25px;
        line-height: 1.12;
      }

      .tools-intro {
        margin-top: 8px;
        font-size: 13px;
        line-height: 1.4;
      }

      .tools-kicker {
        margin-bottom: 6px;
        font-size: 11px;
        letter-spacing: 0.1em;
      }

      .dashboard-strip {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 12px;
      }

      .dashboard-strip a {
        min-width: 0;
        padding: 10px 8px;
      }

      .dashboard-strip strong {
        font-size: 20px;
        line-height: 1;
      }

      .dashboard-strip span {
        margin-top: 4px;
        font-size: 11px;
        line-height: 1.15;
      }

      .tool-card,
      .quick-panel,
      .dashboard-strip a {
        border-radius: 10px;
      }

      .tools-grid {
        gap: 10px;
      }

      .tool-card {
        min-height: 0;
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr);
        gap: 8px 12px;
        padding: 14px;
      }

      .tool-icon {
        width: 42px;
        height: 42px;
        grid-row: span 3;
      }

      .tool-title {
        margin-top: 0;
        font-size: 18px;
        line-height: 1.15;
      }

      .tool-description {
        font-size: 13px;
        line-height: 1.35;
      }

      .tool-footer {
        grid-column: 2;
        align-items: center;
        padding-top: 8px;
        font-size: 12px;
      }

      .tool-action {
        min-height: 34px;
        justify-content: center;
        padding: 7px 10px;
      }

      .quick-panel {
        margin-top: 12px;
        padding: 14px;
      }

      .quick-panel h2 {
        font-size: 18px;
      }

      .quick-panel p {
        font-size: 13px;
        line-height: 1.35;
      }

      .quick-actions {
        gap: 8px;
      }
    }
  `]
})
export class ToolsHomePageComponent {
  private readonly customerBook = inject(CustomerBookService);
  private readonly catalogService = inject(LocalCatalogService);
  private readonly rentalStorageService = inject(RentalStorageService);
  readonly historyCount = computed(() => this.rentalStorageService.readHistory().length);
  readonly customerCount = computed(() => this.customerBook.customers().length);
  readonly availableCatalogCount = computed(() => this.catalogService.items().filter((item) => item.available).length);
  readonly tools: ToolCard[] = [
    {
      title: 'Filigramme',
      description: 'Ajoute un texte en filigrane sur un PDF ou une image, puis telecharge le resultat.',
      route: '/filigramme',
      tone: 'filigramme',
      meta: 'PDF et images'
    },
    {
      title: 'Merge',
      description: 'Assemble plusieurs fichiers PDF dans l ordre voulu et genere un seul document.',
      route: '/merge',
      tone: 'merge',
      meta: 'Fusion PDF'
    },
    {
      title: 'Location',
      description: 'Prepare un bon de location, relis le document avec le client et exporte le PDF.',
      route: '/location',
      tone: 'location',
      meta: 'Document client'
    }
  ];
}

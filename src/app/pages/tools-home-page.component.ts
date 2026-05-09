import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
        padding: 28px 16px;
      }

      .tools-grid {
        grid-template-columns: 1fr;
      }

      .tools-hero h1 {
        font-size: 32px;
      }
    }
  `]
})
export class ToolsHomePageComponent {
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

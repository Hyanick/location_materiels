import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="app-header no-print">
      <a class="app-brand" routerLink="/">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Tools</span>
      </a>

      <nav class="app-nav" aria-label="Navigation principale">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Accueil</a>
        <a routerLink="/filigramme" routerLinkActive="active">Filigramme</a>
        <a routerLink="/merge" routerLinkActive="active">Merge</a>
        <a routerLink="/location" routerLinkActive="active">Location</a>
      </nav>
    </header>

    <router-outlet />
  `
})
export class AppComponent {}

import { Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from './components/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent],
  template: `
    <header class="app-header no-print">
      <a class="app-brand" routerLink="/">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Tools</span>
      </a>

      <button
        class="mobile-menu-toggle"
        type="button"
        [class.active]="isMenuOpen()"
        [attr.aria-expanded]="isMenuOpen()"
        aria-controls="main-navigation"
        aria-label="Ouvrir le menu"
        (click)="toggleMenu()"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav id="main-navigation" class="app-nav" [class.open]="isMenuOpen()" aria-label="Navigation principale">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">Accueil</a>
        <a routerLink="/filigramme" routerLinkActive="active" (click)="closeMenu()">Filigramme</a>
        <a routerLink="/merge" routerLinkActive="active" (click)="closeMenu()">Merge</a>
        <a routerLink="/location" routerLinkActive="active" (click)="closeMenu()">Location</a>
        <a class="mobile-only-link" routerLink="/location/clients" routerLinkActive="active" (click)="closeMenu()">Clients</a>
        <a class="mobile-only-link" routerLink="/location/catalogue" routerLinkActive="active" (click)="closeMenu()">Catalogue</a>
        <a class="mobile-only-link" routerLink="/location/historique" routerLinkActive="active" (click)="closeMenu()">Historique</a>
        <a routerLink="/parametres" routerLinkActive="active" (click)="closeMenu()">Paramètres</a>
      </nav>
    </header>
    @if (isMenuOpen()) {
      <button class="mobile-menu-backdrop no-print" type="button" aria-label="Fermer le menu" (click)="closeMenu()"></button>
    }

    <router-outlet />
    <app-toast-container />
  `
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  readonly isMenuOpen = signal(false);

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.closeMenu();
      this.title.setTitle(this.getTitle(event.urlAfterRedirects));
    });
  }

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  private getTitle(url: string): string {
    if (url.startsWith('/filigramme')) {
      return 'Filigramme - Tools';
    }

    if (url.startsWith('/merge')) {
      return 'Merge PDF - Tools';
    }

    if (url.startsWith('/location/clients')) {
      return 'Clients - Tools';
    }

    if (url.startsWith('/location/catalogue')) {
      return 'Catalogue - Tools';
    }

    if (url.startsWith('/location/historique')) {
      return 'Historique - Tools';
    }

    if (url.startsWith('/location')) {
      return 'Location - Tools';
    }

    if (url.startsWith('/parametres')) {
      return 'Paramètres - Tools';
    }

    return 'Tools';
  }
}

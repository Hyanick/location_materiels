import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-location-subnav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="location-subnav-wrap no-print">
      <button
        class="location-subnav-toggle"
        type="button"
        [class.active]="isOpen()"
        [attr.aria-expanded]="isOpen()"
        aria-controls="location-navigation"
        (click)="toggle()"
      >
        <span>Menu Location</span>
        <span class="location-subnav-chevron" aria-hidden="true"></span>
      </button>

      <nav id="location-navigation" class="location-subnav" [class.open]="isOpen()" aria-label="Navigation Location">
        <a routerLink="/location" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="close()">Bon</a>
        <a routerLink="/location/clients" routerLinkActive="active" (click)="close()">Clients</a>
        <a routerLink="/location/catalogue" routerLinkActive="active" (click)="close()">Catalogue</a>
        <a routerLink="/location/historique" routerLinkActive="active" (click)="close()">Historique</a>
      </nav>
    </div>
  `
})
export class LocationSubnavComponent {
  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  close(): void {
    this.isOpen.set(false);
  }
}

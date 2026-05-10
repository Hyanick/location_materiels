import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationSubnavComponent } from '../components/location-subnav.component';
import { Customer } from '../models/customer.model';
import { CustomerBookService } from '../services/customer-book.service';
import { ToastService } from '../services/toast.service';

const EMPTY_CUSTOMER: Customer = {
  fullName: '',
  address: '',
  postalCode: '',
  city: '',
  phone: '',
  email: ''
};

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationSubnavComponent],
  template: `
    <main class="admin-page">
      <app-location-subnav />
      <section class="admin-hero">
        <p class="tools-kicker">Clients</p>
        <h1>Carnet clients</h1>
        <p>Enregistre les clients récurrents pour les réutiliser dans les bons de location.</p>
      </section>

      <section class="admin-layout">
        <form class="admin-card" (ngSubmit)="saveCustomer()">
          <h2>{{ editingName() ? 'Modifier le client' : 'Nouveau client' }}</h2>
          <label><span>Nom complet</span><input name="fullName" [(ngModel)]="draft.fullName" required /></label>
          <label><span>Adresse</span><input name="address" [(ngModel)]="draft.address" /></label>
          <div class="split-grid">
            <label><span>Code postal</span><input name="postalCode" [(ngModel)]="draft.postalCode" /></label>
            <label><span>Ville</span><input name="city" [(ngModel)]="draft.city" /></label>
          </div>
          <label><span>Téléphone</span><input name="phone" [(ngModel)]="draft.phone" /></label>
          <label><span>Email</span><input name="email" [(ngModel)]="draft.email" /></label>
          <div class="admin-actions">
            <button type="button" class="secondary-btn" (click)="resetDraft()">Annuler</button>
            <button type="submit" class="primary-btn">Enregistrer</button>
          </div>
        </form>

        <section class="admin-card">
          <div class="panel-title">
            <h2>Clients enregistrés</h2>
            <span>{{ filteredCustomers().length }}</span>
          </div>
          <input class="search-input" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Rechercher un client" />

          <div class="admin-list">
            @for (customer of filteredCustomers(); track customer.fullName) {
              <article class="admin-row">
                <div>
                  <strong>{{ customer.fullName }}</strong>
                  <span>{{ customer.phone || 'Téléphone manquant' }} · {{ customer.email || 'Email manquant' }}</span>
                </div>
                <div class="row-actions">
                  <button type="button" class="secondary-btn" (click)="editCustomer(customer)">Modifier</button>
                  <button type="button" class="danger-btn" (click)="deleteCustomer(customer)">Supprimer</button>
                </div>
              </article>
            } @empty {
              <div class="empty-admin">Aucun client enregistré.</div>
            }
          </div>
        </section>
      </section>
    </main>
  `
})
export class CustomersPageComponent {
  private readonly customerBook = inject(CustomerBookService);
  private readonly toast = inject(ToastService);
  readonly query = signal('');
  readonly editingName = signal('');
  draft: Customer = { ...EMPTY_CUSTOMER };
  readonly filteredCustomers = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.customerBook.customers().filter((customer) => {
      const haystack = `${customer.fullName} ${customer.phone} ${customer.email} ${customer.city}`.toLowerCase();
      return !query || haystack.includes(query);
    });
  });

  saveCustomer(): void {
    if (!this.draft.fullName.trim()) {
      this.toast.error('Le nom du client est obligatoire.');
      return;
    }

    if (this.editingName() && this.editingName().toLowerCase() !== this.draft.fullName.trim().toLowerCase()) {
      this.customerBook.delete(this.editingName());
    }

    this.customerBook.addOrUpdate({ ...this.draft, fullName: this.draft.fullName.trim() });
    this.resetDraft();
    this.toast.success('Client enregistré.');
  }

  editCustomer(customer: Customer): void {
    this.editingName.set(customer.fullName);
    this.draft = { ...customer };
  }

  deleteCustomer(customer: Customer): void {
    this.customerBook.delete(customer.fullName);
    this.toast.success('Client supprimé.');
  }

  resetDraft(): void {
    this.editingName.set('');
    this.draft = { ...EMPTY_CUSTOMER };
  }
}

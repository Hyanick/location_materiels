import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationSubnavComponent } from '../components/location-subnav.component';
import { RentalItem } from '../models/rental-item.model';
import { LocalCatalogService } from '../services/local-catalog.service';
import { ToastService } from '../services/toast.service';

const EMPTY_ITEM: RentalItem = {
  id: '',
  label: '',
  unitPrice: 0,
  depositAmount: 0,
  unit: 'piece',
  category: 'chair',
  available: true
};

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationSubnavComponent],
  template: `
    <main class="admin-page">
      <app-location-subnav />
      <section class="admin-hero">
        <p class="tools-kicker">Catalogue</p>
        <h1>Matériel de location</h1>
        <p>Gère les articles, tarifs, cautions et disponibilités utilisés dans les bons.</p>
      </section>

      <section class="admin-layout">
        <form class="admin-card" (ngSubmit)="saveItem()">
          <h2>{{ draft.id ? 'Modifier l’article' : 'Nouvel article' }}</h2>
          <label><span>Libellé</span><input name="label" [(ngModel)]="draft.label" required /></label>
          <div class="split-grid">
            <label><span>Prix unitaire</span><input name="unitPrice" type="number" step="0.01" [(ngModel)]="draft.unitPrice" /></label>
            <label><span>Caution unitaire</span><input name="depositAmount" type="number" step="0.01" [(ngModel)]="draft.depositAmount" /></label>
          </div>
          <div class="split-grid">
            <label><span>Unité</span><select name="unit" [(ngModel)]="draft.unit"><option value="piece">Pièce</option><option value="pack">Pack</option></select></label>
            <label><span>Catégorie</span><select name="category" [(ngModel)]="draft.category">
              <option value="chair">Chaise</option>
              <option value="table">Table</option>
              <option value="tablecloth">Nappe</option>
              <option value="cleaning">Nettoyage</option>
              <option value="pack">Pack</option>
            </select></label>
          </div>
          <label class="toggle-field"><input name="available" type="checkbox" [(ngModel)]="draft.available" /><span>Disponible</span></label>
          <div class="admin-actions">
            <button type="button" class="secondary-btn" (click)="resetDraft()">Annuler</button>
            <button type="submit" class="primary-btn">Enregistrer</button>
          </div>
        </form>

        <section class="admin-card">
          <div class="panel-title">
            <h2>Articles</h2>
            <button type="button" class="secondary-btn" (click)="resetCatalog()">Réinitialiser</button>
          </div>
          <input class="search-input" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Rechercher un article" />

          <div class="admin-list">
            @for (item of filteredItems(); track item.id) {
              <article class="admin-row">
                <div>
                  <strong>{{ item.label }}</strong>
                  <span>{{ formatPrice(item.unitPrice) }} · caution {{ formatPrice(item.depositAmount) }} · {{ item.available ? 'disponible' : 'masqué' }}</span>
                </div>
                <div class="row-actions">
                  <button type="button" class="secondary-btn" (click)="editItem(item)">Modifier</button>
                  <button type="button" class="danger-btn" (click)="deleteItem(item)">Supprimer</button>
                </div>
              </article>
            }
          </div>
        </section>
      </section>
    </main>
  `
})
export class CatalogPageComponent {
  private readonly catalog = inject(LocalCatalogService);
  private readonly toast = inject(ToastService);
  readonly query = signal('');
  draft: RentalItem = { ...EMPTY_ITEM };
  readonly filteredItems = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.catalog.items().filter((item) => !query || item.label.toLowerCase().includes(query));
  });

  saveItem(): void {
    if (!this.draft.label.trim()) {
      this.toast.error('Le libellé est obligatoire.');
      return;
    }

    const id = this.draft.id || this.slugify(this.draft.label);
    this.catalog.upsert({ ...this.draft, id, label: this.draft.label.trim() });
    this.resetDraft();
    this.toast.success('Article enregistré.');
  }

  editItem(item: RentalItem): void {
    this.draft = { ...item };
  }

  deleteItem(item: RentalItem): void {
    this.catalog.delete(item.id);
    this.toast.success('Article supprimé.');
  }

  resetCatalog(): void {
    this.catalog.reset();
    this.toast.success('Catalogue réinitialisé.');
  }

  resetDraft(): void {
    this.draft = { ...EMPTY_ITEM };
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID();
  }
}

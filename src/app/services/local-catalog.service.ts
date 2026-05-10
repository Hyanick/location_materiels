import { Injectable, signal } from '@angular/core';
import { RENTAL_CATALOG } from '../data/rental-catalog.data';
import { RentalItem } from '../models/rental-item.model';

@Injectable()
export class LocalCatalogService {
  private readonly storageKey = 'tools-app/catalog';
  readonly items = signal<RentalItem[]>(this.readItems());

  upsert(item: RentalItem): void {
    this.items.update((items) => {
      const next = [item, ...items.filter((entry) => entry.id !== item.id)].sort((left, right) => left.label.localeCompare(right.label, 'fr'));
      this.persist(next);
      return next;
    });
  }

  delete(id: string): void {
    this.items.update((items) => {
      const next = items.filter((item) => item.id !== id);
      this.persist(next);
      return next;
    });
  }

  replace(items: RentalItem[]): void {
    this.items.set(items);
    this.persist(items);
  }

  getById(id: string): RentalItem | undefined {
    return this.items().find((item) => item.id === id);
  }

  reset(): void {
    this.replace(RENTAL_CATALOG);
  }

  private readItems(): RentalItem[] {
    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return RENTAL_CATALOG;
    }

    try {
      return (JSON.parse(rawValue) as RentalItem[]).map((item) => ({
        ...item,
        depositAmount: item.depositAmount ?? 0,
        available: item.available ?? true
      }));
    } catch {
      return RENTAL_CATALOG;
    }
  }

  private persist(items: RentalItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}

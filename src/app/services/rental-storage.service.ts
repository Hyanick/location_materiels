import { Injectable, signal } from '@angular/core';
import { DEFAULT_RENTAL_DOCUMENT } from '../data/default-rental-document.data';
import { Customer } from '../models/customer.model';
import { RentalDocument } from '../models/rental-document.model';

export interface RentalHistoryEntry {
  id: string;
  savedAt: string;
  customerName: string;
  totalAmount: number;
  document: RentalDocument;
}

/**
 * Service d'accès au localStorage.
 */
@Injectable()
export class RentalStorageService {
  private readonly storageKey = 'rental-document-app/current-document';
  private readonly historyKey = 'rental-document-app/history';
  private readonly recentCustomersKey = 'rental-document-app/recent-customers';
  readonly lastSavedAt = signal('');

  save(document: RentalDocument): void {
    localStorage.setItem(this.storageKey, JSON.stringify(document));
    this.lastSavedAt.set(new Date().toISOString());
    this.saveRecentCustomer(document.customer);
  }

  read(): RentalDocument | null {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      const parsedDocument = JSON.parse(rawValue) as Partial<RentalDocument>;
      return {
        ...DEFAULT_RENTAL_DOCUMENT,
        ...parsedDocument,
        company: {
          ...DEFAULT_RENTAL_DOCUMENT.company,
          ...(parsedDocument.company ?? {})
        },
        customer: {
          ...DEFAULT_RENTAL_DOCUMENT.customer,
          ...(parsedDocument.customer ?? {})
        },
        emailDelivery: {
          ...DEFAULT_RENTAL_DOCUMENT.emailDelivery,
          ...(parsedDocument.emailDelivery ?? {})
        },
        lines: parsedDocument.lines ?? DEFAULT_RENTAL_DOCUMENT.lines
      };
    } catch (error: unknown) {
      console.error('Impossible de relire le document sauvegardé :', error);
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  readHistory(): RentalHistoryEntry[] {
    return this.readJson<RentalHistoryEntry[]>(this.historyKey, []);
  }

  deleteHistoryEntry(id: string): void {
    const history = this.readHistory().filter((entry) => entry.id !== id);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  saveHistoryEntry(document: RentalDocument): void {
    const customerName = document.customer.fullName.trim() || 'Client sans nom';
    const entry: RentalHistoryEntry = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      customerName,
      totalAmount: document.totalAmount,
      document
    };

    const history = [entry, ...this.readHistory()].slice(0, 20);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  readRecentCustomers(): Customer[] {
    return this.readJson<Customer[]>(this.recentCustomersKey, []);
  }

  private saveRecentCustomer(customer: Customer): void {
    if (!customer.fullName.trim()) {
      return;
    }

    const recentCustomers = [
      customer,
      ...this.readRecentCustomers().filter((entry) => entry.fullName.trim().toLowerCase() !== customer.fullName.trim().toLowerCase())
    ].slice(0, 8);

    localStorage.setItem(this.recentCustomersKey, JSON.stringify(recentCustomers));
  }

  private readJson<T>(key: string, fallback: T): T {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return fallback;
    }
  }
}

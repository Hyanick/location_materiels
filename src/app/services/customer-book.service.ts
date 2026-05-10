import { Injectable, signal } from '@angular/core';
import { Customer } from '../models/customer.model';

@Injectable()
export class CustomerBookService {
  private readonly storageKey = 'tools-app/customers';
  readonly customers = signal<Customer[]>(this.readCustomers());

  addOrUpdate(customer: Customer): void {
    const normalizedName = customer.fullName.trim().toLowerCase();
    if (!normalizedName) {
      return;
    }

    this.customers.update((customers) => {
      const next = [
        customer,
        ...customers.filter((entry) => entry.fullName.trim().toLowerCase() !== normalizedName)
      ].sort((left, right) => left.fullName.localeCompare(right.fullName, 'fr'));
      this.persist(next);
      return next;
    });
  }

  delete(fullName: string): void {
    const normalizedName = fullName.trim().toLowerCase();
    this.customers.update((customers) => {
      const next = customers.filter((entry) => entry.fullName.trim().toLowerCase() !== normalizedName);
      this.persist(next);
      return next;
    });
  }

  replace(customers: Customer[]): void {
    this.customers.set(customers);
    this.persist(customers);
  }

  private readCustomers(): Customer[] {
    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return [];
    }

    try {
      return JSON.parse(rawValue) as Customer[];
    } catch {
      return [];
    }
  }

  private persist(customers: Customer[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(customers));
  }
}

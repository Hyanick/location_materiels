import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/rental-document-page.component').then((module) => module.RentalDocumentPageComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

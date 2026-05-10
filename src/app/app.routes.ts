import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tools-home-page.component').then((module) => module.ToolsHomePageComponent)
  },
  {
    path: 'filigramme',
    loadComponent: () => import('./tools/upload/upload.component').then((module) => module.UploadComponent)
  },
  {
    path: 'merge',
    loadComponent: () => import('./tools/pdf-merge/pdf-merge.component').then((module) => module.PdfMergeComponent)
  },
  {
    path: 'location',
    loadComponent: () => import('./pages/rental-document-page.component').then((module) => module.RentalDocumentPageComponent)
  },
  {
    path: 'location/clients',
    loadComponent: () => import('./pages/customers-page.component').then((module) => module.CustomersPageComponent)
  },
  {
    path: 'location/catalogue',
    loadComponent: () => import('./pages/catalog-page.component').then((module) => module.CatalogPageComponent)
  },
  {
    path: 'location/historique',
    loadComponent: () => import('./pages/history-page.component').then((module) => module.HistoryPageComponent)
  },
  {
    path: 'parametres',
    loadComponent: () => import('./pages/settings-page.component').then((module) => module.SettingsPageComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

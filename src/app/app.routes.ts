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
    path: '**',
    redirectTo: ''
  }
];

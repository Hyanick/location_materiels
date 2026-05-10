import { Provider } from '@angular/core';
import { RentalDocumentStore } from '../state/rental-document.store';
import { RentalDocumentActions } from '../actions/rental-document.actions';
import { RentalDocumentProvider } from './rental-document.provider';
import { RentalCalculationService } from '../services/rental-calculation.service';
import { EmailJsDeliveryService } from '../services/emailjs-delivery.service';
import { EmailJsSettingsService } from '../services/emailjs-settings.service';
import { NetworkStatusService } from '../services/network-status.service';
import { AppDataService } from '../services/app-data.service';
import { AppSettingsService } from '../services/app-settings.service';
import { CustomerBookService } from '../services/customer-book.service';
import { LocalCatalogService } from '../services/local-catalog.service';
import { PdfExportService } from '../services/pdf-export.service';
import { PdfPreviewService } from '../services/pdf-preview.service';
import { RentalStorageService } from '../services/rental-storage.service';
import { ToastService } from '../services/toast.service';

/**
 * Providers centralisés de l'application.
 *
 * Cette structure suit l'organisation demandée :
 * service + action + state + provider + component.
 */
export const appProviders: Provider[] = [
  RentalDocumentStore,
  RentalDocumentActions,
  RentalDocumentProvider,
  RentalCalculationService,
  EmailJsDeliveryService,
  EmailJsSettingsService,
  NetworkStatusService,
  AppDataService,
  PdfExportService,
  PdfPreviewService,
  RentalStorageService,
  CustomerBookService,
  LocalCatalogService,
  AppSettingsService,
  ToastService
];

import { RentalItem } from '../models/rental-item.model';

/**
 * Catalogue initial basé sur vos tarifs.
 *
 * Remarque : la nappe est ici à 5 € selon l'image 2.
 * Si vous souhaitez 6 €, remplacez simplement unitPrice: 5 par 6.
 */
export const RENTAL_CATALOG: RentalItem[] = [
  {
    id: 'chair-white-folding',
    label: 'Chaise pliante blanche',
    unitPrice: 1.5,
    depositAmount: 15,
    unit: 'piece',
    category: 'chair',
    available: true
  },
  {
    id: 'table-folding',
    label: 'Table pliante',
    unitPrice: 8,
    depositAmount: 40,
    unit: 'piece',
    category: 'table',
    available: true
  },
  {
    id: 'tablecloth',
    label: 'Nappe ronde ou rectangulaire',
    unitPrice: 5,
    depositAmount: 16,
    unit: 'piece',
    category: 'tablecloth',
    available: true
  },
  {
    id: 'special-pack',
    label: 'Pack spécial : 1 table + 6 chaises',
    unitPrice: 15,
    depositAmount: 130,
    unit: 'pack',
    category: 'pack',
    available: true
  },
  {
    id: 'tablecloth-cleaning',
    label: 'Prise en compte du nettoyage des nappes rendues sales',
    unitPrice: 1,
    depositAmount: 0,
    unit: 'piece',
    category: 'cleaning',
    available: true
  }
];

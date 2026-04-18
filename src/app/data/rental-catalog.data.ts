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
    unit: 'piece',
    category: 'chair'
  },
  {
    id: 'table-folding',
    label: 'Table pliante',
    unitPrice: 8,
    unit: 'piece',
    category: 'table'
  },
  {
    id: 'tablecloth',
    label: 'Nappe ronde ou rectangulaire',
    unitPrice: 5,
    unit: 'piece',
    category: 'tablecloth'
  },
  {
    id: 'special-pack',
    label: 'Pack spécial : 1 table + 6 chaises',
    unitPrice: 15,
    unit: 'pack',
    category: 'pack'
  },
  {
    id: 'tablecloth-cleaning',
    label: 'Prise en compte du nettoyage des nappes rendues sales',
    unitPrice: 1,
    unit: 'piece',
    category: 'cleaning'
  }
];

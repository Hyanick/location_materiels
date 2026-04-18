/**
 * Article du catalogue de location.
 */
export interface RentalItem {
  id: string;
  label: string;
  unitPrice: number;
  unit: 'piece' | 'pack';
  category: 'chair' | 'table' | 'tablecloth' | 'cleaning' | 'pack';
}

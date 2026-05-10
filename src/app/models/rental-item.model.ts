/**
 * Article du catalogue de location.
 */
export interface RentalItem {
  id: string;
  label: string;
  unitPrice: number;
  depositAmount: number;
  unit: 'piece' | 'pack';
  category: 'chair' | 'table' | 'tablecloth' | 'cleaning' | 'pack';
  available: boolean;
}

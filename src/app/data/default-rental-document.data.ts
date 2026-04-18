import { RentalDocument } from '../models/rental-document.model';

/**
 * Document initial affiché au chargement.
 */
export const DEFAULT_RENTAL_DOCUMENT: RentalDocument = {
  company: {
    name: 'GOOD LOCATION',
    address: '1 avenue du Général Leclerc',
    city: '76520 Déville-lès-Rouen',
    phone: '06 14 40 37 47',
    email: 'annie.yanick.2019@gmail.com'
  },
  customer: {
    fullName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: ''
  },
  documentDate: new Date().toISOString().slice(0, 10),
  pickupDate: '',
  returnDate: '',
  paymentMethod: 'Espèces',
  depositPaymentMethod: 'Chèque',
  depositAmount: 0,
  downPayment: 0,
  notes: 'Matériel à retourner dans les mêmes conditions (propreté, pliage, contenant) que lors du retrait/livraison.',
  showSignatureFrame: false,
  customerSignatureDataUrl: '',
  emailDelivery: {
    status: 'draft',
    lastAttemptAt: '',
    lastSentAt: '',
    lastError: ''
  },
  lines: [],
  totalAmount: 0,
  balanceDue: 0
};

export type DonationStatus = 'APPROVED' | 'PENDING' | 'DECLINED' | 'VOIDED' | 'ERROR';

export interface DonationRecord {
  donId: number;
  donWompiTransactionId: string;
  donReference: string;
  donAmountInCents: number;
  donCurrency: string;
  donStatus: string;
  donPaymentMethodType: string | null;
  donDonorEmail: string | null;
  donDonorFullName: string | null;
  donEnvironment: string;
  donCreatedAt: string;
}

export interface DonationFormData {
  amountCOP: number;
  coverFee: boolean;
}

export interface WompiCheckoutConfig {
  currency: 'COP';
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature?: {
    integrity: string;
  };
  redirectUrl?: string;
  customerData?: {
    email?: string;
    fullName?: string;
  };
}

export interface DonationOperationResult {
  success: boolean;
  status: DonationStatus;
  message: string;
  transactionId?: string;
  reference?: string;
  amountCOP?: number;
  donorFullName?: string;
  donorEmail?: string;
  paymentMethodType?: string;
  alreadyRegistered?: boolean;
}

/**
 * Defines the donation status type.
 */

export type DonationStatus = 'APPROVED' | 'PENDING' | 'DECLINED' | 'VOIDED' | 'ERROR';

/**
 * Defines the donation record interface.
 */

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

/**
 * Defines the donation form data interface.
 */

export interface DonationFormData {
  amountCOP: number;
  coverFee: boolean;
}

/**
 * Defines the wompi checkout config interface.
 */

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

/**
 * Defines the donation operation result interface.
 */

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

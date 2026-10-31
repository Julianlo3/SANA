export type DonationStatus = 'APPROVED' | 'PENDING' | 'DECLINED' | 'VOIDED' | 'ERROR';

export type PaymentMethodType = string;

export interface RegisterDonationPayload {
  wompiTransactionId: string;
  reference: string;
  amountInCents: number;
  currency: string;
  status: string;
  paymentMethodType?: string;
  donorEmail?: string;
  donorFullName?: string;
  environment?: string;
  wompiCreatedAt?: string;
}

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

export interface WompiTransactionResponse {
  data: {
    id: string;
    created_at: string;
    amount_in_cents: number;
    reference: string;
    currency: string;
    payment_method_type: PaymentMethodType;
    payment_method?: {
      type: string;
      extra?: Record<string, unknown>;
    };
    status: DonationStatus;
    status_message?: string;
    customer_email?: string;
    customer_data?: {
      full_name?: string;
      phone_number?: string;
    };
  };
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

/** Transaction fields consumed from a Wompi webhook event. */
export interface WompiTransaction {
  id: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  status: string;
  status_message?: string;
  payment_method_type?: string;
  customer_email?: string;
  customer_data?: { full_name?: string };
  created_at?: string;
}

/** Authenticated webhook payload sent by Wompi after a transaction change. */
export interface WompiEvent {
  event: string;
  environment: string;
  timestamp: number;
  data: { transaction: WompiTransaction };
  signature: { properties: string[]; checksum: string };
}

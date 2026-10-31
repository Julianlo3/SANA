'use server';

import crypto from 'crypto';
import {
  calculateWompiFee,
  generateDonationReference,
  MIN_DONATION_COP,
} from '../services/wompi-service';
import type {
  DonationFormData,
  DonationOperationResult,
  WompiTransactionResponse,
} from '../types/donation-types';

/**
 * Function that prepares the data for the Wompi checkout
 * @param data DonationFormData
 * @returns object with the data for the Wompi checkout
 */
export async function prepareDonationCheckoutAction(data: DonationFormData) {
  const baseCOP = Math.floor(Number(data.amountCOP) || 0);

  if (baseCOP < MIN_DONATION_COP) {
    throw new Error(`El monto mínimo de donación es de $ ${MIN_DONATION_COP.toLocaleString('es-CO')} COP`);
  }

  const { totalWithFee } = calculateWompiFee(baseCOP);
  const finalAmountCOP = data.coverFee ? totalWithFee : baseCOP;
  const amountInCents = finalAmountCOP * 100;
  const currency = 'COP';
  const reference = generateDonationReference();

  const integritySecret = (process.env.WOMPI_INTEGRITY_SECRET || '').trim();
  if (!integritySecret) {
    throw new Error(
      'Configuración incompleta: WOMPI_INTEGRITY_SECRET no está definida en las variables de entorno.',
    );
  }

  // Fórmula oficial de Wompi: sha256(reference + amountInCents + currency + secret)
  const rawString = `${reference}${amountInCents}${currency}${integritySecret}`;
  const integritySignature = crypto
    .createHash('sha256')
    .update(rawString)
    .digest('hex');

  const publicKey = (
    process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||
    'pub_test_GSU1NtKHNeU3uByOGGJcTiN0AQHmWfxn'
  ).trim();

  return {
    reference,
    amountInCents,
    amountCOP: finalAmountCOP,
    baseAmountCOP: baseCOP,
    currency,
    publicKey,
    signature: integritySignature,
  };
}

/**
 * Function that verifies the status of the transaction directly in the Wompi API
 * @param transactionId Transaction ID
 * @param extraDonorData Extra donor data
 * @returns Object with the transaction status
 */
export async function verifyTransactionStatusAction(
  transactionId: string,
  extraDonorData?: { fullName?: string; email?: string },
): Promise<DonationOperationResult> {
  if (!transactionId || typeof transactionId !== 'string') {
    return {
      success: false,
      status: 'ERROR',
      message: 'ID de transacción inválido o no suministrado.',
    };
  }

  const cleanTxId = transactionId.trim();
  const privateKey = (process.env.WOMPI_PRIVATE_KEY || '').trim();
  const publicKey = (process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '').trim();

  // Consultar la transacción en la API oficial de Wompi
  let wompiTx: WompiTransactionResponse['data'] | null = null;
  const apiHosts = ['https://api.wompi.co/v1', 'https://sandbox.wompi.co/v1'];

  for (const host of apiHosts) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (privateKey) {
        headers['Authorization'] = `Bearer ${privateKey}`;
      } else if (publicKey) {
        headers['Authorization'] = `Bearer ${publicKey}`;
      }

      const res = await fetch(`${host}/transactions/${cleanTxId}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (res.ok) {
        const json: WompiTransactionResponse = await res.json();
        if (json?.data?.id) {
          wompiTx = json.data;
          break;
        }
      }
    } catch {
      // Intentar siguiente host si hay fallo de red
    }
  }

  // Si por timeout o red no responde la API de Wompi pero tenemos el ID, devolvemos estado PENDING
  if (!wompiTx) {
    return {
      success: true,
      status: 'PENDING',
      transactionId: cleanTxId,
      message:
        'Tu transacción se encuentra en proceso de validación. La confirmación oficial llegará a tu correo.',
    };
  }

  const {
    id,
    reference,
    amount_in_cents,
    status,
    payment_method_type,
    customer_email,
    customer_data,
  } = wompiTx;

  const isApproved = status === 'APPROVED';
  const isPending = status === 'PENDING';

  return {
    success: isApproved || isPending,
    status,
    transactionId: id,
    reference,
    amountCOP: Math.floor(amount_in_cents / 100),
    donorFullName: customer_data?.full_name || extraDonorData?.fullName || undefined,
    donorEmail: customer_email || extraDonorData?.email || undefined,
    paymentMethodType: payment_method_type || undefined,
    message: isApproved
      ? '¡Donación aprobada exitosamente!'
      : isPending
        ? 'Tu donación está en proceso de validación bancaria.'
        : 'La entidad bancaria no aprobó la transacción.',
  };
}

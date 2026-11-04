'use server';

import { webcrypto } from 'node:crypto';
import {
  calculateWompiFee,
  generateDonationReference,
  MAX_DONATION_COP,
  MIN_DONATION_COP,
} from '../services/wompi-service';
import type {
  DonationFormData,
} from '../types/donation-types';

/**
 * Function that prepares the data for the Wompi checkout
 * @param data DonationFormData
 * @returns object with the data for the Wompi checkout
 */
export async function prepareDonationCheckoutAction(data: DonationFormData) {
  const baseCOP = Number(data.amountCOP);

  if (!Number.isSafeInteger(baseCOP) || baseCOP < MIN_DONATION_COP) {
    throw new Error(`El monto mínimo de donación es de $ ${MIN_DONATION_COP.toLocaleString('es-CO')} COP`);
  }
  if (baseCOP > MAX_DONATION_COP) {
    throw new Error(
      `El monto máximo para donar en línea es de $ ${MAX_DONATION_COP.toLocaleString('es-CO')} COP`,
    );
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
  const signatureBuffer = await webcrypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawString),
  );
  const integritySignature = Array.from(new Uint8Array(signatureBuffer), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

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

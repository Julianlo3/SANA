// Tarifas oficiales estándar vigentes de Wompi Colombia (Plan Agregador):
// Comisión: 2.65% + $700 COP por transacción exitosa.
// IVA: 19% aplicable exclusivamente sobre el valor de la comisión.
const WOMPI_FEE_PERCENT = 0.0265; // 2.65%
const WOMPI_FEE_FIXED = 700; // $700 COP
const IVA_PERCENT = 0.19; // 19% de IVA sobre la comisión

const MIN_DONATION_COP = 1000; // Mínimo técnico en COP para procesar pasarela

/**
 * Calculates the exact fee according to Wompi Colombia's official pricing:
 * Fee = (Amount * 2.65% + $700) * 1.19 (IVA included)
 * @param baseAmountCOP Amount of the donation
 * @returns Object with base amount, fee amount, total with fee, and net received amounts
 */
export function calculateWompiFee(baseAmountCOP: number): {
  baseAmount: number;
  feeAmount: number;
  totalWithFee: number;
  netReceivedIfCovered: number;
  netReceivedIfNotCovered: number;
} {
  const amount = Math.max(0, Math.floor(baseAmountCOP));
  if (amount === 0) {
    return {
      baseAmount: 0,
      feeAmount: 0,
      totalWithFee: 0,
      netReceivedIfCovered: 0,
      netReceivedIfNotCovered: 0,
    };
  }

  // 1. Comisión base antes de impuestos
  const rawBaseFee = amount * WOMPI_FEE_PERCENT + WOMPI_FEE_FIXED;

  // 2. Aplicación de IVA del 19% sobre la comisión de la pasarela
  const feeWithVAT = Math.round(rawBaseFee * (1 + IVA_PERCENT));

  // En ningún caso la comisión supera el monto si el usuario no cubre
  const feeAmount = Math.max(0, feeWithVAT);
  const totalWithFee = amount + feeAmount;
  const netReceivedIfNotCovered = Math.max(0, amount - feeAmount);

  return {
    baseAmount: amount,
    feeAmount,
    totalWithFee,
    netReceivedIfCovered: amount,
    netReceivedIfNotCovered,
  };
}

/**
 * Formats a value in Colombian Pesos (COP) without decimals.
 * @param amountCOP Amount of the donation
 * @param includeCurrency Whether to include the currency
 * @returns Formatted currency string
 */
export function formatCOP(amountCOP: number, includeCurrency = false): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCOP || 0);

  return includeCurrency ? `${formatted} COP` : formatted;
}

/**
 * Generates a unique reference for the donation with SANA-DON prefix.
 * @returns Unique reference for the donation
 */
export function generateDonationReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SANA-DON-${ts}-${rand}`;
}

export { MIN_DONATION_COP };

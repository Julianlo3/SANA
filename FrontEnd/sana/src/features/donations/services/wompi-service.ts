// Tarifas públicas del Plan Avanzado Agregador de Wompi Colombia:
// 2.65% + $700 COP + IVA sobre la tarifa, por transacción exitosa.
const WOMPI_FEE_FIXED = 700; // $700 COP

const MIN_DONATION_COP = 1000; // Mínimo técnico en COP para procesar pasarela
const MAX_DONATION_COP = 50_000_000; // Límite operativo del formulario, no legal ni de Wompi
const FEE_RATE_SCALED = 31_535; // 2,65% * 1,19 expresado sobre 1.000.000
const FEE_SCALE = 1_000_000;
const FIXED_FEE_WITH_IVA = 833; // $700 COP + 19% de IVA

type FeeBreakdown = {
  percentageFeeAmount: number;
  fixedFeeAmount: number;
  ivaAmount: number;
  totalFee: number;
};

/**
 * Calculates the transaction fee based on the donation amount.
 * @param amountCOP Amount of the donation in Colombian Pesos
 * @returns Object with the breakdown of the fee
 */
function calculateTransactionFee(amountCOP: number): FeeBreakdown {
  const percentageFeeAmount = Math.floor((amountCOP * 265 + 5_000) / 10_000);
  const fixedFeeAmount = WOMPI_FEE_FIXED;
  const totalFee = Math.floor(
    (amountCOP * FEE_RATE_SCALED +
      FIXED_FEE_WITH_IVA * FEE_SCALE +
      FEE_SCALE / 2) /
      FEE_SCALE,
  );

  return {
    percentageFeeAmount,
    fixedFeeAmount,
    ivaAmount: totalFee - percentageFeeAmount - fixedFeeAmount,
    totalFee,
  };
}

/**
 * Calculates the payment amount needed to cover the transaction fee.
 * @param donationAmountCOP Amount of the donation in Colombian Pesos
 * @returns The total amount to charge the donor so that the foundation receives the intended donation after fees
 */
function calculateCoveredPaymentAmount(donationAmountCOP: number): number {
  // El cálculo se hace resolviendo la ecuación:
  // donationAmountCOP = totalWithFee - (totalWithFee * FEE_RATE_SCALED + FIXED_FEE_WITH_IVA * FEE_SCALE) / FEE_SCALE
  // donationAmountCOP = totalWithFee * (1 - FEE_RATE_SCALED / FEE_SCALE) - FIXED_FEE_WITH_IVA
  // donationAmountCOP + FIXED_FEE_WITH_IVA = totalWithFee * (1 - FEE_RATE_SCALED / FEE_SCALE)
  // (donationAmountCOP + FIXED_FEE_WITH_IVA) / (1 - FEE_RATE_SCALED / FEE_SCALE) = totalWithFee
  // Para evitar problemas de redondeo, se hace un ajuste hacia arriba.
  const threshold =
    (donationAmountCOP - 1) * FEE_SCALE +
    FIXED_FEE_WITH_IVA * FEE_SCALE +
    FEE_SCALE / 2;
  return Math.floor(threshold / (FEE_SCALE - FEE_RATE_SCALED)) + 1;
}

/**
 * Estimates the fee using Wompi's public Plan Avanzado Agregador tariff:
 * 2.65% + $700 COP, then 19% IVA on that fee. If the donor covers the fee,
 * solves for the smallest checkout amount that leaves at least the donation
 * amount after Wompi's fee is applied to the full checkout amount.
 * @param baseAmountCOP Amount of the donation
 * @returns Object with base amount, fee amount, total with fee, and net received amounts
 */
export function calculateWompiFee(baseAmountCOP: number): {
  baseAmount: number;
  feeAmount: number;
  percentageFeeAmount: number;
  fixedFeeAmount: number;
  ivaAmount: number;
  totalWithFee: number;
  coveredFeeAmount: number;
  coveredPercentageFeeAmount: number;
  coveredFixedFeeAmount: number;
  coveredIvaAmount: number;
  netReceivedIfCovered: number;
  netReceivedIfNotCovered: number;
} {
  const amount = Number.isFinite(baseAmountCOP)
    ? Math.max(0, Math.floor(baseAmountCOP))
    : 0;
  if (!Number.isSafeInteger(amount) || amount > MAX_DONATION_COP) {
    throw new RangeError(
      `El monto máximo para donar en línea es de ${formatCOP(MAX_DONATION_COP, true)}.`,
    );
  }

  if (amount === 0) {
    return {
      baseAmount: 0,
      feeAmount: 0,
      percentageFeeAmount: 0,
      fixedFeeAmount: 0,
      ivaAmount: 0,
      totalWithFee: 0,
      coveredFeeAmount: 0,
      coveredPercentageFeeAmount: 0,
      coveredFixedFeeAmount: 0,
      coveredIvaAmount: 0,
      netReceivedIfCovered: 0,
      netReceivedIfNotCovered: 0,
    };
  }

  const baseFee = calculateTransactionFee(amount);
  const totalWithFee = calculateCoveredPaymentAmount(amount);
  const coveredFee = calculateTransactionFee(totalWithFee);

  return {
    baseAmount: amount,
    feeAmount: baseFee.totalFee,
    percentageFeeAmount: baseFee.percentageFeeAmount,
    fixedFeeAmount: baseFee.fixedFeeAmount,
    ivaAmount: baseFee.ivaAmount,
    totalWithFee,
    coveredFeeAmount: totalWithFee - amount,
    coveredPercentageFeeAmount: coveredFee.percentageFeeAmount,
    coveredFixedFeeAmount: coveredFee.fixedFeeAmount,
    coveredIvaAmount: coveredFee.ivaAmount,
    netReceivedIfCovered: totalWithFee - coveredFee.totalFee,
    netReceivedIfNotCovered: amount - baseFee.totalFee,
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

export { MAX_DONATION_COP, MIN_DONATION_COP };

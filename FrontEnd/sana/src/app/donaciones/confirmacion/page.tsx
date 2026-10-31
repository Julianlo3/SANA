import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PublicHeader from '@/components/navigation/public-header';
import PublicFooter from '@/components/navigation/public-footer';
import DonationResultModal from '@/features/donations/components/donation-result-modal';
import { verifyTransactionStatusAction } from '@/features/donations/actions/donation-actions';

export const metadata: Metadata = {
  title: 'Confirmación de Donación · Fundación Dejando Huellas Felices',
};

interface ConfirmacionPageProps {
  searchParams: Promise<{ id?: string }>;
}

/**
 * Component page Confirmation Donation
 * @param searchParams Promise of object with transaction id
 * @returns JSX.Element
 */
export default async function ConfirmacionDonacionPage({
  searchParams,
}: ConfirmacionPageProps) {
  const { id } = await searchParams;

  const result = id
    ? await verifyTransactionStatusAction(id)
    : {
      success: false,
      status: 'ERROR' as const,
      message: 'No se encontró un identificador de transacción en la URL.',
    };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <PublicHeader />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-xl px-6">
          <div className="mb-6">
            <Link
              href="/donaciones"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a donaciones</span>
            </Link>
          </div>

          <DonationResultModal
            result={result}
            onReset={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/donaciones';
              }
            }}
          />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

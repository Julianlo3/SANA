import { Metadata } from 'next';
import {
  Heart,
  Sparkles,
  Users,
  HelpCircle,
} from 'lucide-react';
import PublicHeader from '@/components/navigation/public-header';
import PublicFooter from '@/components/navigation/public-footer';
import DonationForm from '@/features/donations/components/donation-form';
import DonationBannerCarousel from '@/features/donations/components/donation-banner-carousel';
import { getPublicBanners } from '@/features/content/services/public-content-service';

export const metadata: Metadata = {
  title: 'Donaciones · Fundación Dejando Huellas Felices',
  description:
    'Apoya nuestra labor social en la Fundación Dejando Huellas Felices. Cada donación transforma la vida de niñas, niños y familias en situación de vulnerabilidad.',
};

/**
 * Component page Donaciones
 * Integrates dynamic banners managed by content staff and responsive Wompi donation flow.
 * @returns JSX.Element
 */
export default async function DonacionesPage() {
  const banners = await getPublicBanners();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <PublicHeader />

      <main className="flex-1">
        {/* Banner de encabezado emotivo */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-primary-soft)]/60 to-[var(--color-background)] pt-12 pb-8 sm:pt-16 sm:pb-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-strong)]">
                <Heart className="h-3.5 w-3.5 fill-[var(--color-accent)]" />
                <span>Tu generosidad transforma vidas</span>
              </span>

              <h1 className="mt-4 font-display text-3xl sm:text-5xl font-black text-[var(--color-text)] tracking-tight">
                Haz parte del cambio que ellas y ellos necesitan
              </h1>

              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
                Cada aporte que realizas permite que brindemos acompañamiento psicosocial, nutrición y educación a la niñez que más lo necesita en nuestra comunidad.
              </p>
            </div>
          </div>
        </section>

        {/* Contenido principal: Grid de 2 columnas */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Columna Izquierda: Banners Dinámicos, Narrativa y FAQ (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Carrusel dinámico de banners administrados por rol de contenido */}
              <DonationBannerCarousel banners={banners} />

              {/* Pilares del impacto */}
              <div className="space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)]">
                  ¿Cómo se invierte tu donación?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-xs">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] mb-3">
                      <Heart className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-xs text-[var(--color-text)]">
                      Atención Terapéutica
                    </h3>
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Consultas de psicología y apoyo emocional continuo.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-xs">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] mb-3">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-xs text-[var(--color-text)]">
                      Nutrición & Salud
                    </h3>
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Refrigerios y seguimiento nutricional regular.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-xs">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] mb-3">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-xs text-[var(--color-text)]">
                      Talleres y Familia
                    </h3>
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Acompañamiento a madres, padres y cuidadores.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preguntas frecuentes rápidas */}
              <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                  <HelpCircle className="h-4 w-4 text-[var(--color-primary)]" />
                  <span>Preguntas Frecuentes</span>
                </div>

                <div className="space-y-3 text-xs text-[var(--color-text-muted)]">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">
                      ¿Qué medios de pago puedo utilizar?
                    </p>
                    <p className="mt-0.5 leading-relaxed">
                      Gracias a Wompi (Bancolombia) puedes pagar de forma 100% segura mediante tarjeta de crédito o débito (Visa, Mastercard, Amex), cuentas de ahorros vía PSE, transferencia directa Bancolombia o Nequi.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <p className="font-semibold text-[var(--color-text)]">
                      ¿Qué sucede si pago por PSE o transferencia?
                    </p>
                    <p className="mt-0.5 leading-relaxed">
                      Si tu banco toma unos minutos en autorizar la transferencia, la transacción quedará en estado pendiente y el sistema registrará tu donación automáticamente tan pronto sea aprobada.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <p className="font-semibold text-[var(--color-text)]">
                      ¿Por qué se sugiere cubrir la comisión?
                    </p>
                    <p className="mt-0.5 leading-relaxed">
                      Las pasarelas bancarias cobran un porcentaje por procesar pagos. Al marcar la opción de cubrirla, asumes ese pequeño costo adicional para que el 100% de tu dinero llegue a los niños. Es totalmente voluntario.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Sticky de Donación con Wompi (5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <DonationForm />
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import PageDecor from "@/components/ui/page-decor";

type Props = {
  readonly searchParams: Promise<{ tipo?: string }>;
};

const COPY = {
  staff: {
    title: "Acceso seguro",
    description:
      "Área reservada para el equipo de la Fundación Dejando Huellas Felices.",
    note: "Solo pueden ingresar cuentas aprobadas por la administración de la fundación.",
    returnTo: "%2Fpanel",
    switchLabel: "¿Eres consultante?",
    switchAction: "Entra aquí",
    switchHref: "/iniciar-sesion?tipo=consultante",
  },
  requester: {
    title: "Mi cuenta",
    description: "Consulta el estado de tus citas y tus datos.",
    note: "Entra con la cuenta de Google que usaste al pedir tu cita.",
    returnTo: "%2Fmi-cuenta",
    switchLabel: "¿Eres parte del equipo?",
    switchAction: "Acceso personal autorizado",
    switchHref: "/iniciar-sesion",
  },
} as const;

export default async function LoginPage({ searchParams }: Props) {
  const { tipo } = await searchParams;
  const copy = tipo === "consultante" ? COPY.requester : COPY.staff;

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <PageDecor variant="auth" />

      <div className="relative z-10 w-full max-w-md text-center">
        <Image
          src="/brand/isotipo.png"
          alt=""
          width={96}
          height={96}
          priority
          className="mx-auto h-20 w-20 object-contain"
        />

        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-primary-dark">
          {copy.title}
        </h1>

        <p className="mx-auto mt-4 max-w-xs leading-relaxed text-text-muted">
          {copy.description}
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <a
            href={`/auth/login?connection=google-oauth2&returnTo=${copy.returnTo}`}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface py-4 font-semibold text-text transition hover:bg-surface-muted"
          >
            <Image
              src="/icons/google.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5"
            />

            Iniciar sesión con Google
          </a>

          <p className="mt-4 text-xs leading-relaxed text-text-subtle">
            {copy.note}
          </p>
        </div>

        <p className="mt-6 text-sm text-text-muted">
          {copy.switchLabel}{" "}
          <Link
            href={copy.switchHref}
            className="font-semibold text-primary transition hover:text-primary-dark"
          >
            {copy.switchAction}
          </Link>
        </p>

        <p className="mt-10 text-xs text-text-subtle">
          Privacidad · Términos
        </p>
      </div>
    </main>
  );
}
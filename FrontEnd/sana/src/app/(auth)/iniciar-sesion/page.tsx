import Image from "next/image";
import PageDecor from "@/components/ui/page-decor";

/**
 * Page for logging in to the application.
 * @returns The login page.
 */
export default function LoginPage() {
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
          Iniciar sesión
        </h1>

        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-text-muted">
          Accede a tus citas, gestiona la atención o administra la plataforma según tu rol autorizado.
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <a
            href="/auth/login?connection=google-oauth2&returnTo=%2Fpanel"
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
            Usa la cuenta de Google vinculada a tu cita o autorizada por la administración de la fundación.
          </p>
        </div>

        <p className="mt-10 text-xs text-text-subtle">
          Privacidad · Términos y Condiciones
        </p>
      </div>
    </main>
  );
}
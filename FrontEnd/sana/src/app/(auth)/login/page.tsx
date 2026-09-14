import PageDecor from "@/components/ui/PageDecor";

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <PageDecor variant="auth" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <span className="font-display text-2xl font-bold text-white">S</span>
        </div>

        <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-primary-dark">
          Acceso Seguro
        </h1>

        <p className="mx-auto mt-4 max-w-xs leading-relaxed text-text-muted">
          Área reservada para el equipo de la Fundación Dejando Huellas Felices.
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <button className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface py-4 font-semibold text-text transition hover:bg-surface-muted">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v4h6a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-2 3.2-4.8 3.2-8.1Z" />
              <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.6 1.1-2.8 0-5.2-1.9-6-4.5H2.3v2.9A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M6 14.1a6.6 6.6 0 0 1 0-4.2V7H2.3a11 11 0 0 0 0 9.9L6 14.1Z" />
              <path fill="#EA4335" d="M12 4.8c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.3 7L6 9.9c.8-2.6 3.2-4.5 6-4.5Z" />
            </svg>
            Iniciar sesión con Google
          </button>

          <p className="mt-4 text-xs leading-relaxed text-text-subtle">
            Solo pueden ingresar cuentas aprobadas por la administración de la
            fundación.
          </p>
        </div>

        <div className="mt-10">
          <a href="#" className="text-sm font-semibold text-accent-strong hover:underline">
            ¿Problemas para acceder?
          </a>
          <p className="mt-3 text-xs text-text-subtle">Privacidad · Términos</p>
        </div>
      </div>
    </main>
  );
}
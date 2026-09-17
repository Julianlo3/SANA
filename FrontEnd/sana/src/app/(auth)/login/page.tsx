import PageDecor from "@/components/ui/page-decor";

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
        
          <a 
            href="/auth/login?connection=google-oauth2&returnTo=%2Fusers"
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface py-4 font-semibold text-text transition hover:bg-surface-muted"
          >
            Iniciar sesión con Google
          </a>


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
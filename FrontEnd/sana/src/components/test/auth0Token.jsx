import { auth0 } from '@/lib/auth0';

export default async function Auth0Token() {
  const session = await auth0.getSession();
  let tokenData = null;

  if (session) {
    try {
      tokenData = await auth0.getAccessToken();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Auth0 Access Token
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Verifica el token JWT proporcionado por Auth0.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
          Auth
        </span>
      </div>

      {!session ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            No has iniciado sesión. <a href="/auth/login" className="underline font-semibold hover:text-amber-900">Inicia sesión</a> para obtener tu token.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              ✓ Sesión Activa ({session.user.name})
            </p>
          </div>
          
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Access Token:</p>
            <div className="rounded-lg bg-slate-900 p-4">
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-emerald-400">
                {tokenData?.token || 'Token no disponible o es Opaque Token'}
              </pre>
            </div>
            
            <p className="mt-3 text-xs text-slate-500">
              {tokenData?.token?.startsWith('eyJ') 
                ? 'El token parece ser un JWT válido. ¡Listo para enviar a la API!' 
                : 'Si ves un string corto (no eyJ...), Auth0 te entregó un opaque token. Revisa tu AUTH0_AUDIENCE y vuelve a iniciar sesión.'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

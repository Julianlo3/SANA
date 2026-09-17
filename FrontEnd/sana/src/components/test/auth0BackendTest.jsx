'use client';

import { useState } from 'react';
import { testBackendAuthMe } from '@/app/(test)/test/actions';

export default function Auth0BackendTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testBackendAuth = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await testBackendAuthMe();
      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error desconocido',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Backend Auth Test
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Verifica la conexión enviando el token al backend (NestJS).
          </p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-600">
          NestJS
        </span>
      </div>

      <button
        onClick={testBackendAuth}
        disabled={loading}
        className="mt-5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Probando...' : 'Probar conexión a /auth/me'}
      </button>

      {result && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            ✓ ¡El backend aceptó el token!
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-white p-4 text-xs text-slate-700">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            ✕ La prueba falló
          </p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}
    </section>
  );
}

'use client';

import { useState } from 'react';

export default function HealthCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testHealth = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/healthz`,
        {
          credentials: 'include',
        },
      );

      const data = await response.json();

      setResult({
        status: response.status,
        data,
      });
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
            Health Check
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Verifica la comunicación entre frontend y backend.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          API
        </span>
      </div>

      <button
        onClick={testHealth}
        disabled={loading}
        className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Probando...' : 'Ejecutar prueba'}
      </button>

      {result && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            ✓ Backend funcionando
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

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

    </section>
  );
}
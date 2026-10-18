'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWompiSignatureAction } from '@/app/(test)/test/actions';

const WOMPI_API_URL = 'https://sandbox.wompi.co/v1';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const WOMPI_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_GSU1NtKHNeU3uByOGGJcTiN0AQHmWfxn';

/** Predefined donation amounts (COP) */
const SUGGESTED_AMOUNTS = [5000, 10000, 20000, 50000];

/** Format COP currency */
function formatCOP(cents) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Generate a unique reference for the transaction */
function generateReference() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SANA-DON-${ts}-${rand}`;
}

export default function WompiDonationTest() {
  // ---------- state ----------
  const [amountCOP, setAmountCOP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [widgetReady, setWidgetReady] = useState(false);

  // Post-payment flow
  const [transactionResult, setTransactionResult] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState(null);

  // Donation history
  const [donations, setDonations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const scriptLoaded = useRef(false);

  // ---------- Load Wompi widget.js ----------
  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Check if already loaded
    if (typeof window !== 'undefined' && window.WidgetCheckout) {
      setWidgetReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => setWidgetReady(true);
    script.onerror = () => setError('No se pudo cargar el widget de Wompi');
    document.head.appendChild(script);
  }, []);

  // ---------- Register donation in backend ----------
  const registerDonation = useCallback(async (txn) => {
    setRegistering(true);
    try {
      const registerRes = await fetch(`${API_URL}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          wompiTransactionId: txn.id,
          reference: txn.reference,
          amountInCents: txn.amountInCents,
          currency: txn.currency,
          status: txn.status,
          paymentMethodType: txn.paymentMethodType || null,
          donorEmail: txn.customerEmail || null,
          donorFullName: txn.customerData?.fullName || null,
          environment: 'test',
          wompiCreatedAt: txn.createdAt || null,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        if (registerRes.status === 409) {
          setRegisterResult({
            success: true,
            message: 'Donación ya registrada previamente',
            data: registerData,
          });
        } else {
          throw new Error(
            registerData?.message || `Backend error: ${registerRes.status}`,
          );
        }
      } else {
        setRegisterResult({
          success: true,
          message: 'Donación registrada exitosamente en el backend',
          data: registerData,
        });
      }
    } catch (err) {
      setRegisterResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al registrar',
      });
    } finally {
      setRegistering(false);
    }
  }, []);

  // ---------- initiate donation via Widget ----------
  const handleDonate = async () => {
    const amountNum = parseInt(amountCOP, 10);
    if (!amountNum || amountNum < 2000) {
      setError('El monto mínimo es $2,000 COP');
      return;
    }

    if (!widgetReady || !window.WidgetCheckout) {
      setError('El widget de Wompi aún no está cargado. Intenta de nuevo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountInCents = amountNum * 100;
      const reference = generateReference();
      const currency = 'COP';

      // Generate integrity signature via server action
      const signature = await generateWompiSignatureAction(
        reference,
        amountInCents,
        currency,
      );

      // Build widget configuration (do NOT include redirectUrl with localhost, CloudFront WAF blocks it with 403)
      const widgetConfig = {
        currency,
        amountInCents,
        reference,
        publicKey: WOMPI_PUBLIC_KEY,
      };

      // Add signature if available
      if (signature) {
        widgetConfig.signature = { integrity: signature };
      }

      // Open Wompi Widget
      const checkout = new window.WidgetCheckout(widgetConfig);

      checkout.open(function (result) {
        setLoading(false);

        if (result && result.transaction) {
          const txn = result.transaction;
          setTransactionResult(txn);

          // If approved, register in backend
          if (txn.status === 'APPROVED') {
            registerDonation(txn);
          }
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir el widget');
      setLoading(false);
    }
  };

  // ---------- load donation history ----------
  const loadHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    setLoadingHistory(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/donations`, {
        headers: { Origin: window.location.origin },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || `Error: ${res.status}`);

      setDonations(Array.isArray(data) ? data : []);
      setShowHistory(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  // ---------- status badge ----------
  const StatusBadge = ({ status }) => {
    const colors = {
      APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      DECLINED: 'bg-red-100 text-red-700 border-red-200',
      VOIDED: 'bg-orange-100 text-orange-700 border-orange-200',
      ERROR: 'bg-red-100 text-red-700 border-red-200',
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    const colorClass = colors[status] || 'bg-slate-100 text-slate-600 border-slate-200';

    return (
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
        {status}
      </span>
    );
  };

  // ---------- render ----------
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            💚 Donaciones Wompi
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Flujo completo de donación usando Widget de Wompi (Sandbox).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${widgetReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Sandbox
          </span>
        </div>
      </div>

      {/* ===== Transaction result ===== */}
      {transactionResult && (
        <div className={`mt-5 rounded-lg border p-4 ${
          transactionResult.status === 'APPROVED'
            ? 'border-emerald-200 bg-emerald-50'
            : transactionResult.status === 'DECLINED'
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold ${
              transactionResult.status === 'APPROVED'
                ? 'text-emerald-800'
                : transactionResult.status === 'DECLINED'
                  ? 'text-red-800'
                  : 'text-amber-800'
            }`}>
              {transactionResult.status === 'APPROVED'
                ? '✓ ¡Donación exitosa!'
                : transactionResult.status === 'DECLINED'
                  ? '✕ Transacción rechazada'
                  : `Transacción: ${transactionResult.status}`}
            </p>
            <StatusBadge status={transactionResult.status} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div><span className="font-medium">ID:</span> {transactionResult.id}</div>
            <div><span className="font-medium">Ref:</span> {transactionResult.reference}</div>
            <div><span className="font-medium">Monto:</span> {formatCOP(transactionResult.amountInCents)}</div>
            <div><span className="font-medium">Método:</span> {transactionResult.paymentMethodType || 'N/A'}</div>
          </div>

          {/* Backend registration result */}
          {registering && (
            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 animate-pulse">
              ⏳ Registrando en el backend...
            </div>
          )}

          {registerResult && (
            <div className={`mt-3 rounded-md p-3 text-xs ${
              registerResult.success
                ? 'bg-white border border-emerald-200 text-emerald-700'
                : 'bg-white border border-red-200 text-red-700'
            }`}>
              <p className="font-semibold">
                {registerResult.success ? '✓' : '✕'} Backend: {registerResult.message}
              </p>
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
              Ver respuesta completa del Widget
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-white p-3 text-xs text-slate-600 border border-slate-200">
              {JSON.stringify(transactionResult, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* ===== Donation form ===== */}
      {!transactionResult && (
        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Monto de la donación (COP)
          </label>

          {/* Suggested amounts */}
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountCOP(String(amt))}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  amountCOP === String(amt)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                {formatCOP(amt * 100)}
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                $
              </span>
              <input
                type="number"
                min="2000"
                step="1000"
                placeholder="Mínimo $2,000..."
                value={amountCOP}
                onChange={(e) => setAmountCOP(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <button
              onClick={handleDonate}
              disabled={loading || !amountCOP || !widgetReady}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Abriendo...' : 'Donar con Wompi'}
            </button>
          </div>

          {amountCOP && parseInt(amountCOP, 10) >= 2000 && (
            <p className="mt-2 text-xs text-slate-500">
              Se abrirá el widget de Wompi por {formatCOP(parseInt(amountCOP, 10) * 100)}
            </p>
          )}

          {/* Sandbox info */}
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-1">
              🧪 Datos de prueba (Sandbox)
            </p>
            <div className="space-y-0.5 text-xs text-slate-500">
              <p>• Tarjeta aprobada: <code className="rounded bg-white px-1 py-0.5 font-mono text-green-600">4242 4242 4242 4242</code></p>
              <p>• Tarjeta rechazada: <code className="rounded bg-white px-1 py-0.5 font-mono text-red-500">4111 1111 1111 1111</code></p>
              <p>• Nequi aprobado: <code className="rounded bg-white px-1 py-0.5 font-mono text-green-600">3991111111</code></p>
              <p>• CVC: cualquier 3 dígitos · Expiración: cualquier fecha futura</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== Error display ===== */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">✕ Error</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ===== Reset / New Donation ===== */}
      {transactionResult && (
        <button
          onClick={() => {
            setTransactionResult(null);
            setRegisterResult(null);
            setError(null);
            setAmountCOP('');
          }}
          className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Nueva donación
        </button>
      )}

      {/* ===== Donation history ===== */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          onClick={loadHistory}
          disabled={loadingHistory}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {loadingHistory
            ? 'Cargando...'
            : showHistory
              ? 'Ocultar historial'
              : '📋 Ver historial de donaciones'}
        </button>

        {showHistory && donations.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Referencia</th>
                  <th className="px-3 py-2 font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Método</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d.donId || d.donWompiTransactionId} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-700">
                      {d.donReference}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {formatCOP(Number(d.donAmountInCents))}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={d.donStatus} />
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {d.donPaymentMethodType || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(d.donCreatedAt).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showHistory && donations.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">
            No hay donaciones registradas aún.
          </p>
        )}
      </div>
    </section>
  );
}

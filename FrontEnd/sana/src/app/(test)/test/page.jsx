import HealthCheck from '@/components/test/healthCheck';
//import Auth0Login from '@/components/test/Auth0Login';
//import SessionTest from '@/components/test/SessionTest';
//import ProtectedApi from '@/components/test/ProtectedApi';

export default function TestPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            HUELLITAS · TEST
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Pruebas del sistema
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Panel para validar el funcionamiento de los diferentes
            servicios de la aplicación.
          </p>
        </header>

        {/* Pruebas */}
        <div className="space-y-5">

          <HealthCheck />

        </div>
      </div>
    </main>
  );
}
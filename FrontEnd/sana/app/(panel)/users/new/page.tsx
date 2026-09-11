"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import PageDecor from "@/components/ui/PageDecor";
import Button from "@/components/ui/Button";
import { ROLES } from "@/lib/mocks/users";

type FormFields = {
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
  roleId: string;
};

const emptyForm: FormFields = {
  fullName: "",
  identityDocument: "",
  email: "",
  phone: "",
  roleId: "",
};

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormFields>>({});

  function update(field: keyof FormFields, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(): boolean {
    const found: Partial<FormFields> = {};

    if (!form.fullName.trim()) {
      found.fullName = "El nombre es obligatorio.";
    }

    if (!form.identityDocument.trim()) {
      found.identityDocument = "El documento es obligatorio.";
    } else if (!/^\d{6,12}$/.test(form.identityDocument)) {
      found.identityDocument = "Debe contener entre 6 y 12 dígitos.";
    }

    if (!form.email.trim()) {
      found.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      found.email = "El formato del correo no es válido.";
    } else if (!/@(gmail\.com|googlemail\.com)$/i.test(form.email)) {
      found.email =
        "Debe ser una cuenta de Google, porque el acceso es por OAuth.";
    }

    if (!form.phone.trim()) {
      found.phone = "El teléfono es obligatorio.";
    } else if (!/^\d{7,10}$/.test(form.phone)) {
      found.phone = "Debe contener entre 7 y 10 dígitos.";
    }

    if (!form.roleId) {
      found.roleId = "Debe asignar un rol.";
    }

    setErrors(found);
    return Object.keys(found).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    console.log("Crear usuario:", form);
    router.push("/users");
  }

  return (
    <>
      <PageDecor variant="users" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </Link>

        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-primary-dark">
          Crear Usuario
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Registra una cuenta para el personal autorizado de la fundación y
          asígnale su rol.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <Field
            label="Nombre completo"
            value={form.fullName}
            error={errors.fullName}
            onChange={(value) => update("fullName", value)}
            placeholder="Nombres y apellidos"
          />

          <Field
            label="Documento de identidad"
            value={form.identityDocument}
            error={errors.identityDocument}
            onChange={(value) => update("identityDocument", value)}
            placeholder="Numero de documento sin puntos ni guiones"
          />

          <Field
            label="Correo de Google"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(value) => update("email", value)}
            placeholder="Correo@gmail.com"
          />

          <Field
            label="Teléfono de contacto"
            value={form.phone}
            error={errors.phone}
            onChange={(value) => update("phone", value)}
            placeholder="Numero de contacto sin espacios ni guiones"
          />

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-text">
              Rol en la plataforma <span className="text-danger">*</span>
            </span>
            <select
              value={form.roleId}
              onChange={(event) => update("roleId", event.target.value)}
              className={`mt-2 w-full cursor-pointer rounded-xl border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.roleId ? "border-danger" : "border-border"
              }`}
            >
              <option value="">Seleccionar rol...</option>
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <span className="mt-1.5 block text-xs text-danger">
                {errors.roleId}
              </span>
            )}
          </label>

          <div className="mt-6 flex gap-3 rounded-xl bg-primary-soft p-4 text-xs text-text-muted">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
            <p>
              Al crear la cuenta se le notificará por correo. Solo podrá
              ingresar con la cuenta de Google registrada aquí.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => router.push("/users")}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Crear usuario</Button>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="mt-5 block first:mt-0">
      <span className="text-sm font-semibold text-text">
        {label} <span className="text-danger">*</span>
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-xl border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? "border-danger" : "border-border"
        }`}
      />
      {error && (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      )}
    </label>
  );
}
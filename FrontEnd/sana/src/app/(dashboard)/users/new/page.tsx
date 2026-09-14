"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import PageDecor from "@/components/ui/page-decor";
import Button from "@/components/ui/button";
import { ROLE_CATALOG } from "@/lib/mocks/users-mock";

type FormFields = {
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
};

const emptyForm: FormFields = {
  fullName: "",
  identityDocument: "",
  email: "",
  phone: "",
};

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Partial<FormFields>>({});
  const [rolesError, setRolesError] = useState<string>();

  function update(field: keyof FormFields, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toggleRole(id: number) {
    setRolesError(undefined);
    setRoleIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
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

    const missingRoles = roleIds.length === 0;
    setRolesError(missingRoles ? "Debe asignar al menos un rol." : undefined);

    setErrors(found);
    return Object.keys(found).length === 0 && !missingRoles;
  }

  function handleSubmit() {
    if (!validate()) return;

    console.log("Crear usuario:", { ...form, roleIds });
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

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-primary-dark sm:text-5xl">
          Crear Usuario
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Registra una cuenta para el personal autorizado de la fundación y
          asígnale sus roles.
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
            placeholder="Número de documento sin puntos ni guiones"
          />

          <Field
            label="Correo de Google"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(value) => update("email", value)}
            placeholder="correo@gmail.com"
          />

          <Field
            label="Teléfono de contacto"
            value={form.phone}
            error={errors.phone}
            onChange={(value) => update("phone", value)}
            placeholder="Número de contacto sin espacios ni guiones"
          />

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-text">
              Roles en la plataforma <span className="text-danger">*</span>
            </legend>
            <p className="mt-1 text-xs text-text-subtle">
              Una persona puede tener más de un rol a la vez.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ROLE_CATALOG.map((role) => {
                const checked = roleIds.includes(role.id);

                return (
                  <label
                    key={role.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-primary bg-primary-soft text-text"
                        : "border-border text-text-muted hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role.id)}
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                    {role.name}
                  </label>
                );
              })}
            </div>

            {rolesError && (
              <span className="mt-2 block text-xs text-danger">
                {rolesError}
              </span>
            )}
          </fieldset>

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
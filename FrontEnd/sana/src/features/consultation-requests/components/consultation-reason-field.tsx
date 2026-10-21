"use client";

type Props = {
  readonly value: string;
  readonly error?: string;
  readonly rows?: number;
  readonly placeholder?: string;
  readonly onChange: (value: string) => void;
};

export default function ConsultationReasonField({
  value,
  error,
  rows = 3,
  placeholder,
  onChange,
}: Props) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-text">
        Motivo de la consulta (opcional)
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={1000}
        aria-invalid={Boolean(error)}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

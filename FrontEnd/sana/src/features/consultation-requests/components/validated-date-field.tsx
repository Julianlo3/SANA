"use client";

type Props = {
  readonly label: string;
  readonly value: string;
  readonly error?: string;
  readonly max?: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
};

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40";

/**
 * A date field with validation for consultation requests.
 * @param param0 The props for the component.
 * @returns A JSX element representing the validated date field.
 */
export default function ValidatedDateField({
  label,
  value,
  error,
  max,
  onChange,
  onBlur,
}: Props) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-text">
        {label} <span className="text-danger" aria-hidden>*</span>
      </span>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={INPUT_CLASS}
      />
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

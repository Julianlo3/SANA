"use client";

type SelectOption = {
  readonly value: string | number;
  readonly label: string;
};

type Props = {
  readonly label: string;
  readonly value: string | number;
  readonly options: readonly SelectOption[];
  readonly error?: string;
  readonly emptyLabel?: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
};

const INPUT_CLASS =
  "mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40";

/**
 * A select field with validation for consultation requests.
 * @param param0 The props for the component.
 * @returns A JSX element representing the validated select field.
 */
export default function ValidatedSelectField({
  label,
  value,
  options,
  error,
  emptyLabel = "Selecciona",
  onChange,
  onBlur,
}: Props) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-text">
        {label} <span className="text-danger" aria-hidden>*</span>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={INPUT_CLASS}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

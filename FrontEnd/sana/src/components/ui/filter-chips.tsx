type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  readonly options: readonly Option<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
};

const CHIP_BASE =
  "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition";
const CHIP_ACTIVE = "border-primary bg-primary text-white";
const CHIP_IDLE =
  "border-border bg-surface text-text-muted hover:border-primary hover:text-primary";

/** Filtro por botones: una sola opción activa a la vez. */
export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`${CHIP_BASE} ${isActive ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
/**
 * Defines the option type.
 */
type Option<T extends string> = {
  value: T;
  label: string;
};

/**
 * Defines the props type.
 */
type Props<T extends string> = {
  readonly options: readonly Option<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
};

/**
 * Defines the chip base.
 */
const CHIP_BASE =
  "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition";
/**
 * Defines the chip active.
 */
const CHIP_ACTIVE = "border-primary bg-primary text-white";
/**
 * Defines the chip idle.
 */
const CHIP_IDLE =
  "border-border bg-surface text-text-muted hover:border-primary hover:text-primary";

/**
 * Renders button filters with a single active option.
 * @param props Component properties.
 */
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
import { Clock } from "lucide-react";
import { dayStatus, formatMinutes } from "../lib/psychologist-calendar";
import type {
  DaySummary,
  TimeRange,
} from "../types/psychologist-calendar-types";

type Props = {
  readonly date: Date;
  readonly summary: DaySummary | undefined;
};

const STATUS = {
  free: { label: "Tiene espacio", background: "#fbeaf0", color: "#993556" },
  full: { label: "Sin espacio", background: "#e6f1fb", color: "#134176" },
  none: {
    label: "Sin disponibilidad",
    background: "#f1efe8",
    color: "#5f5e5a",
  },
} as const;

function formatLongDate(date: Date): string {
  const text = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ children }: { readonly children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-text">
      <Clock size={14} aria-hidden className="text-text-subtle" />
      {children}
    </li>
  );
}

function rangeText(range: TimeRange): string {
  return `${formatMinutes(range.start)} – ${formatMinutes(range.end)}`;
}

/** Detalle de un día: citas, bloques de disponibilidad y horas libres. */
export default function DayDetail({ date, summary }: Props) {
  const status = STATUS[dayStatus(summary)];
  const blocks = summary?.blocks ?? [];
  const appointments = summary?.appointments ?? [];
  const free = summary?.free ?? [];

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-text">
          {formatLongDate(date)}
        </h2>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: status.background, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {blocks.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          Este día el psicólogo no marcó disponibilidad.
        </p>
      ) : (
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <Section title="Horas libres">
            {free.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin horas libres.</p>
            ) : (
              <ul className="space-y-1.5">
                {free.map((range) => (
                  <Row key={`free-${range.start}`}>{rangeText(range)}</Row>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Citas">
            {appointments.length === 0 ? (
              <p className="text-sm text-text-subtle">Sin citas.</p>
            ) : (
              <ul className="space-y-1.5">
                {appointments.map((item) => (
                  <Row key={`app-${item.start}`}>
                    {rangeText(item)}
                    {item.appointmentId !== null
                      ? ` · Cita #${item.appointmentId}`
                      : " · Ocupado"}
                  </Row>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Disponibilidad marcada">
            <ul className="space-y-1.5">
              {blocks.map((range) => (
                <Row key={`block-${range.start}`}>{rangeText(range)}</Row>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </section>
  );
}
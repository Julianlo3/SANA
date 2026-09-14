import PageDecor from "@/components/ui/page-decor";

type Tone = "info" | "danger";

type Props = {
  icon: React.ReactNode;
  tone?: Tone;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
};

export default function StatusCard({
  icon,
  tone = "info",
  title,
  children,
  actions,
}: Props) {
  const badgeStyles =
    tone === "danger"
      ? "bg-danger-soft text-danger"
      : "bg-primary-soft text-primary";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <PageDecor variant="auth" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${badgeStyles}`}
        >
          {icon}
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold text-primary-dark">
          {title}
        </h1>

        <div className="mt-4 text-sm leading-relaxed text-text-muted">
          {children}
        </div>

        <div className="mt-8 flex flex-col gap-3">{actions}</div>
      </div>
    </main>
  );
}
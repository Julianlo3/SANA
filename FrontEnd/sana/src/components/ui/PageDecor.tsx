type DecorVariant = "requests" | "users" | "auth" | "default";

const variants: Record<DecorVariant, string[]> = {
  requests: [
    "-top-28 right-20 h-72 w-72 bg-highlight",
    "top-16 -right-24 h-96 w-96 bg-accent-soft",
  ],
  users: [
    "-top-32 -right-16 h-96 w-96 bg-accent-soft",
    "top-24 right-56 h-52 w-52 bg-highlight",
    "-bottom-28 -left-20 h-72 w-72 bg-primary-soft",
  ],
  auth: [
    "-top-24 -left-24 h-96 w-96 bg-accent-soft",
    "-bottom-32 -right-20 h-[28rem] w-[28rem] bg-highlight",
    "top-1/3 right-1/4 h-40 w-40 bg-primary-soft",
  ],
  default: ["-top-24 -right-24 h-80 w-80 bg-highlight"],
};

export default function PageDecor({
  variant = "default",
}: {
  variant?: DecorVariant;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {variants[variant].map((position, index) => (
        <span
          key={index}
          className={`absolute rounded-full opacity-60 ${position}`}
        />
      ))}
    </div>
  );
}
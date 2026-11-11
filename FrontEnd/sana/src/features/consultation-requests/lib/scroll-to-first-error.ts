/**
 * Scrolls to and focuses the first invalid form field.
 * Finds the first field marked invalid or associated with an alert message.
 */
export function scrollToFirstError() {
  const target = document.querySelector<HTMLElement>(
    '[aria-invalid="true"], [role="alert"]',
  );
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "center" });

  const field = target
    .closest("label, div")
    ?.querySelector<HTMLElement>("input, select, textarea");
  field?.focus({ preventScroll: true });
}
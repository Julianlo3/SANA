/**
 * Lleva la pantalla al primer campo con error y le da el foco.
 * Busca el primer campo marcado como inválido o con un mensaje de alerta.
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